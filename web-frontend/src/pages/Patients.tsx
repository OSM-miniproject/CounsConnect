import patients from "../data/dummyClients";

const Patients = () => {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Patient List</h1>
      <ul className="space-y-2">
        {patients.map((p) => (
          <li key={p.id} className="border p-4 rounded shadow">
            <p><strong>Name:</strong> {p.name}</p>
            <p><strong>Age:</strong> {p.age}</p>
            <p><strong>Status:</strong> {p.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Patients;