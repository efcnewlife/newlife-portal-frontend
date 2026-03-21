import React from "react";
import { MdDashboard } from "react-icons/md";

const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MdDashboard className="text-2xl text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Welcome to the system home page</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">System status</h3>
          <p className="text-gray-600 dark:text-gray-400">The system is running normally</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">User management</h3>
          <p className="text-gray-600 dark:text-gray-400">Manage system users</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Permission management</h3>
          <p className="text-gray-600 dark:text-gray-400">Configure system permissions</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
