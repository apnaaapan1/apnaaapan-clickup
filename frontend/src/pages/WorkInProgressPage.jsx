const WorkInProgressPage = ({ title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 px-8 py-10 text-center shadow-sm max-w-lg w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 text-base">Developer is Working on it</p>
      </div>
    </div>
  );
};

export default WorkInProgressPage;
