import dummyTasks from "../data/dummyTasks";

const Tasks = () => {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Counselor Tasks</h1>
      <ul className="space-y-3">
        {dummyTasks.map((task) => (
          <li key={task.id} className="p-4 border rounded shadow">
            <p><strong>Task:</strong> {task.title}</p>
            <p><strong>Due:</strong> {task.due}</p>
            <p><strong>Status:</strong> <span className={task.status === "Completed" ? "text-green-600" : "text-yellow-600"}>{task.status}</span></p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;
