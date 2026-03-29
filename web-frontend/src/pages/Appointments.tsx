import { useState } from "react";
import dummyAppointments from "../data/dummyAppointments";
import { Calendar, Clock, User, Video, MapPin, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  mode: "Online" | "In-person" | "Offline";
  status: "Upcoming" | "Completed" | "Missed";
}

interface StatusDetails {
  color: string;
  icon: JSX.Element;
}

interface GroupedAppointments {
  [date: string]: Appointment[];
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(dummyAppointments as Appointment[]);
  const [filter, setFilter] = useState("all");

  const handleStatusChange = (id: string, status: "Completed" | "Missed"): void => {
    const updated = appointments.map((app: Appointment) =>
      app.id === id ? { ...app, status } : app
    );
    setAppointments(updated);
  };

  const filteredAppointments = filter === "all" 
    ? appointments 
    : appointments.filter(app => app.status.toLowerCase() === filter);

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce<GroupedAppointments>((groups, appointment) => {
    const date = appointment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {});

  // Get status color and icon
  const getStatusDetails = (status: string): StatusDetails => {
    switch(status.toLowerCase()) {
      case "upcoming":
        return { 
          color: "bg-blue-100 text-blue-800", 
          icon: <AlertCircle size={16} className="text-blue-600" /> 
        };
      case "completed":
        return { 
          color: "bg-green-100 text-green-800", 
          icon: <CheckCircle size={16} className="text-green-600" /> 
        };
      case "missed":
        return { 
          color: "bg-red-100 text-red-800", 
          icon: <XCircle size={16} className="text-red-600" /> 
        };
      default:
        return { 
          color: "bg-gray-100 text-gray-800", 
          icon: <AlertCircle size={16} className="text-gray-600" /> 
        };
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
            <p className="text-gray-600">Manage your upcoming and past sessions</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  filter === "all"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("upcoming")}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${
                  filter === "upcoming"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === "completed"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setFilter("missed")}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                  filter === "missed"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Missed
              </button>
            </div>
          </div>
        </div>

        {Object.keys(groupedAppointments).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
            <p className="text-gray-500 mt-2">There are no {filter !== "all" ? filter : ""} appointments to display</p>
          </div>
        ) : (
          Object.keys(groupedAppointments).map(date => (
            <div key={date} className="mb-6">
              <div className="flex items-center mb-4">
                <Calendar size={20} className="text-blue-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">{date}</h2>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {groupedAppointments[date].map(app => {
                  const statusDetails = getStatusDetails(app.status);
                  
                  return (
                    <div key={app.id} className="border-b last:border-b-0 border-gray-200">
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <div className="flex items-start">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-4">
                              {app.clientName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <h3 className="text-lg font-medium text-gray-900">{app.clientName}</h3>
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.color}`}>
                                  {statusDetails.icon}
                                  <span className="ml-1">{app.status}</span>
                                </span>
                              </div>
                              <div className="mt-1 flex items-center text-sm text-gray-500">
                                <Clock size={16} className="mr-1" />
                                <span>{app.time}</span>
                                <span className="mx-2">•</span>
                                {app.mode === "Online" ? (
                                  <span className="flex items-center">
                                    <Video size={16} className="mr-1" />
                                    Online Session
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <MapPin size={16} className="mr-1" />
                                    In-person
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {app.status.toLowerCase() === "upcoming" && (
                            <div className="mt-4 sm:mt-0 flex space-x-2">
                              <button
                                onClick={() => handleStatusChange(app.id, "Completed")}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Complete
                              </button>
                              <button
                                onClick={() => handleStatusChange(app.id, "Missed")}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              >
                                <XCircle size={16} className="mr-1" />
                                Missed
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Appointments;