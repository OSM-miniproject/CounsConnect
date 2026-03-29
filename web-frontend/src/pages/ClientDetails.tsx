import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

// Dummy client detail
const dummyClient = {
  id: "1",
  name: "John Doe",
  age: 22,
  issues: ["Exam fear", "Anxiety", "Future worries"],
  swot: {
    strengths: "Creative, Hardworking",
    weaknesses: "Overthinking",
    opportunities: "Supportive family",
    threats: "Low confidence",
  },
  notes: "",
};

const ClientDetails = () => {
  const { id } = useParams();
  const [client, setClient] = useState(dummyClient);
  const [notes, setNotes] = useState(client.notes);

  useEffect(() => {
    // In real app: fetch client from backend using ID
    setClient(dummyClient);
    setNotes(dummyClient.notes);
  }, [id]);

  const handleSaveNotes = () => {
    console.log("Saved Notes for client", client.id, ":", notes);
    setClient({ ...client, notes });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Client Profile: {client.name}</h1>
      <p><strong>Age:</strong> {client.age}</p>
      <p><strong>Issues:</strong> {client.issues.join(", ")}</p>
      <div className="mt-4">
        <h2 className="font-semibold">SWOT Analysis:</h2>
        <p><strong>Strengths:</strong> {client.swot.strengths}</p>
        <p><strong>Weaknesses:</strong> {client.swot.weaknesses}</p>
        <p><strong>Opportunities:</strong> {client.swot.opportunities}</p>
        <p><strong>Threats:</strong> {client.swot.threats}</p>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Counselor Notes:</h2>
        <textarea
          rows={6}
          className="w-full border p-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          onClick={handleSaveNotes}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Notes
        </button>
      </div>
    </div>
  );
};

export default ClientDetails;
