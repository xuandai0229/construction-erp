const { PrismaClient } = require('../generated/prisma-client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Simple parser for schema.prisma to extract models, fields, types, and directives
function parsePrismaSchema() {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const models = {};
  let currentModel = null;
  const lines = content.split('\n');
  
  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('model ')) {
      const match = line.match(/^model\s+(\w+)\s*\{/);
      if (match) {
        currentModel = match[1];
        models[currentModel] = { fields: {} };
      }
    } else if (line.startsWith('enum ')) {
      // Just track enums roughly if needed
    } else if (line === '}') {
      currentModel = null;
    } else if (currentModel && line && !line.startsWith('@@') && !line.startsWith('//')) {
      // Parse field line: "id String @id"
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0];
        let fieldType = parts[1];
        
        // Handle optional and list types
        const isOptional = fieldType.endsWith('?');
        const isList = fieldType.endsWith('[]');
        const baseType = fieldType.replace(/\?|\[\]/, '');
        
        // Extract annotations/attributes
        const attrs = parts.slice(2).join(' ');
        const isId = attrs.includes('@id');
        const isUnique = attrs.includes('@unique');
        
        models[currentModel].fields[fieldName] = {
          fieldName,
          fieldType,
          baseType,
          isOptional,
          isList,
          isId,
          isUnique,
          raw: line
        };
      }
    }
  });
  
  return models;
}

async function getActualDatabaseSchema() {
  // 1. Get all tables
  const tablesRes = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  `);
  const tables = tablesRes.map(r => r.table_name);
  
  // 2. Get all columns for each table
  const columns = {};
  for (const table of tables) {
    const colsRes = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
    `, table);
    
    columns[table] = {};
    colsRes.forEach(col => {
      columns[table][col.column_name] = {
        columnName: col.column_name,
        dataType: col.data_type,
        isNullable: col.is_nullable === 'YES',
        columnDefault: col.column_default
      };
    });
  }
  
  // 3. Get all enums
  const enumsRes = await prisma.$queryRawUnsafe(`
    SELECT t.typname as enum_name, e.enumlabel as enum_value
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
  `);
  const enums = {};
  enumsRes.forEach(r => {
    if (!enums[r.enum_name]) {
      enums[r.enum_name] = [];
    }
    enums[r.enum_name].push(r.enum_value);
  });
  
  return { tables, columns, enums };
}

async function analyze() {
  try {
    const prismaModels = parsePrismaSchema();
    const dbSchema = await getActualDatabaseSchema();
    
    const report = {
      missingTables: [],
      mismatchedTables: {},
      enumDrift: {},
      extraTables: []
    };
    
    // Compare tables
    for (const modelName of Object.keys(prismaModels)) {
      const tableName = modelName; 
      
      if (!dbSchema.tables.includes(tableName)) {
        report.missingTables.push(modelName);
        continue;
      }
      
      // Compare fields/columns
      const model = prismaModels[modelName];
      const dbColumns = dbSchema.columns[tableName];
      
      const missingFields = [];
      const typeMismatches = [];
      
      for (const fieldName of Object.keys(model.fields)) {
        const field = model.fields[fieldName];
        
        // Skip relation fields
        const isRelationField = Object.keys(prismaModels).includes(field.baseType) && (field.isList || field.isOptional || !field.isId);
        if (isRelationField && !field.isId) {
          continue;
        }
        
        if (!dbColumns[fieldName]) {
          missingFields.push(fieldName);
        }
      }
      
      if (missingFields.length > 0 || typeMismatches.length > 0) {
        report.mismatchedTables[modelName] = {
          missingFields,
          typeMismatches
        };
      }
    }
    
    // Check extra tables
    for (const table of dbSchema.tables) {
      if (table === '_prisma_migrations') continue;
      if (!Object.keys(prismaModels).includes(table)) {
        report.extraTables.push(table);
      }
    }
    
    console.log(JSON.stringify(report, null, 2));
    
  } catch (err) {
    console.error('Error analyzing drift:', err);
  } finally {
    await prisma.$disconnect();
  }
}

analyze();
