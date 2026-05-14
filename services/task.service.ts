import { prisma } from "@/lib/prisma";
import { Prisma, TaskStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { CreateTaskDTO, UpdateTaskDTO } from "@/lib/validations";

export class TaskService {
  static async findMany(params: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: TaskStatus;
    assigneeId?: string;
    search?: string;
    orderBy?: "createdAt" | "title" | "status";
    orderDir?: "asc" | "desc";
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      ...(params.projectId && { projectId: params.projectId }),
      ...(params.status && { status: params.status }),
      ...(params.assigneeId && { assigneeId: params.assigneeId }),
      ...(params.search && {
        title: { contains: params.search, mode: "insensitive" },
      }),
    };

    const orderBy = params.orderBy ?? "createdAt";
    const orderDir = params.orderDir ?? "desc";

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: orderDir },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      throw new ApiError(404, "Không tìm thấy công việc");
    }

    return task;
  }

  static async create(data: CreateTaskDTO) {
    // Validate relations concurrently
    const [project, category, assignee] = await Promise.all([
      prisma.project.findUnique({ where: { id: data.projectId } }),
      data.categoryId ? prisma.category.findUnique({ where: { id: data.categoryId } }) : Promise.resolve(null),
      data.assigneeId ? prisma.user.findUnique({ where: { id: data.assigneeId } }) : Promise.resolve(null),
    ]);

    if (!project) throw new ApiError(404, "Không tìm thấy dự án");
    if (data.categoryId && !category) throw new ApiError(404, "Không tìm thấy danh mục công việc");
    if (data.assigneeId && !assignee) throw new ApiError(404, "Không tìm thấy người thực hiện");

    const createData: Prisma.TaskCreateInput = {
      title: data.title,
      description: data.description,
      status: data.status,
      project: { connect: { id: data.projectId } },
      ...(data.categoryId && { category: { connect: { id: data.categoryId } } }),
      ...(data.assigneeId && { assignee: { connect: { id: data.assigneeId } } }),
    };

    return prisma.task.create({
      data: createData,
      include: { project: { select: { id: true, name: true } } },
    });
  }

  static async update(id: string, data: UpdateTaskDTO) {
    await this.findById(id);

    // Validate relations if they are being updated
    const promises = [];
    if (data.projectId) {
      promises.push(
        prisma.project.findUnique({ where: { id: data.projectId } }).then(p => {
          if (!p) throw new ApiError(404, "Không tìm thấy dự án");
        })
      );
    }
    if (data.categoryId) {
      promises.push(
        prisma.category.findUnique({ where: { id: data.categoryId } }).then(c => {
          if (!c) throw new ApiError(404, "Không tìm thấy danh mục công việc");
        })
      );
    }
    if (data.assigneeId) {
      promises.push(
        prisma.user.findUnique({ where: { id: data.assigneeId } }).then(u => {
          if (!u) throw new ApiError(404, "Không tìm thấy người thực hiện");
        })
      );
    }

    await Promise.all(promises);

    const updateData: Prisma.TaskUpdateInput = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.projectId !== undefined && { project: { connect: { id: data.projectId } } }),
      ...(data.categoryId !== undefined && {
        category: data.categoryId ? { connect: { id: data.categoryId } } : { disconnect: true },
      }),
      ...(data.assigneeId !== undefined && {
        assignee: data.assigneeId ? { connect: { id: data.assigneeId } } : { disconnect: true },
      }),
    };

    return prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  static async delete(id: string) {
    await this.findById(id);

    return prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
