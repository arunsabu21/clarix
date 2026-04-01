import Sidebar from "../components/Sidebar/Sidebar";
function MainLayout({ children }) {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}

export default MainLayout;
