import { Metadata } from 'next';
import ProjectListScreen from './ProjectListScreen';

export const metadata: Metadata = {
  title: 'Dự án | Construction ERP',
  description: 'Quản lý danh sách dự án xây dựng',
};

export default function ProjectsPage() {
  return <ProjectListScreen />;
}
