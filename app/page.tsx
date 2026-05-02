import Sidebar from './Sidebar';
import ProjectsPage from './projects';

export default function Home() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <ProjectsPage />
    </div>
  );
}
