import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Type definition for the form
interface FormData {
  name: string;
  age: string;
  gender: string;
  education: string;
  maritalStatus: string;
  profession: string;
  issues: string[];
  symptoms: string[];
  wantsGrowth: boolean;
  swot: {
    strengths: string;
    weaknesses: string;
    opportunities: string;
    threats: string;
  };
}

const IntakeForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    gender: "",
    education: "",
    maritalStatus: "",
    profession: "",
    issues: [],
    symptoms: [],
    wantsGrowth: false,
    swot: {
      strengths: "",
      weaknesses: "",
      opportunities: "",
      threats: "",
    },
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Intake:", formData);
    navigate("/clients");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Client Intake Form</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <>
            <input placeholder="Name" className="w-full border p-2" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <input placeholder="Age" className="w-full border p-2" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
            <select className="w-full border p-2" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Transgender</option>
            </select>
            <select className="w-full border p-2" value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })}>
              <option value="">Education</option>
              <option>UG</option>
              <option>Grad</option>
              <option>PG</option>
            </select>
            <select className="w-full border p-2" value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}>
              <option value="">Marital Status</option>
              <option>Married</option>
              <option>Unmarried</option>
              <option>Divorced</option>
              <option>Widowed</option>
            </select>
            <input placeholder="Profession" className="w-full border p-2" value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} />
          </>
        )}

        {step === 2 && (
          <>
            <label className="block font-semibold">Issues:</label>
            <div className="grid grid-cols-2 gap-2">
              {["Exam fear", "Future worries", "Anxiety", "Anger", "Depression", "Loneliness"].map((issue) => (
                <label key={issue} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={issue}
                    onChange={() => {
                      const updated = formData.issues.includes(issue)
                        ? formData.issues.filter(i => i !== issue)
                        : [...formData.issues, issue];
                      setFormData({ ...formData, issues: updated });
                    }}
                    checked={formData.issues.includes(issue)}
                  />
                  <span>{issue}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <label className="block font-semibold">SWOT Analysis:</label>
            <input placeholder="Strengths" className="w-full border p-2" onChange={(e) => setFormData({ ...formData, swot: { ...formData.swot, strengths: e.target.value } })} />
            <input placeholder="Weaknesses" className="w-full border p-2" onChange={(e) => setFormData({ ...formData, swot: { ...formData.swot, weaknesses: e.target.value } })} />
            <input placeholder="Opportunities" className="w-full border p-2" onChange={(e) => setFormData({ ...formData, swot: { ...formData.swot, opportunities: e.target.value } })} />
            <input placeholder="Threats" className="w-full border p-2" onChange={(e) => setFormData({ ...formData, swot: { ...formData.swot, threats: e.target.value } })} />
            <label className="flex items-center space-x-2 mt-2">
              <input type="checkbox" checked={formData.wantsGrowth} onChange={(e) => setFormData({ ...formData, wantsGrowth: e.target.checked })} />
              <span>Interested in Personality Development</span>
            </label>
          </>
        )}

        <div className="flex justify-between">
          {step > 1 && <button type="button" onClick={handleBack} className="px-4 py-2 border rounded">Back</button>}
          {step < 3 ? (
            <button type="button" onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
          ) : (
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>
          )}
        </div>
      </form>
    </div>
  );
};

export default IntakeForm;
