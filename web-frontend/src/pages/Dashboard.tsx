import { useState, useEffect } from 'react';
import { auth } from "../firebase/config";
import { Calendar, Users, Clock, FileText, Bell, CreditCard } from 'lucide-react';

const Dashboard = () => {
  const user = auth.currentUser;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    todayAppointments: 3,
    pendingForms: 5,
    newClients: 2
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  interface Stats {
    todayAppointments: number;
    pendingForms: number;
    newClients: number;
  }

  interface Appointment {
    time: string;
    name: string;
    mode: string;
    status: string;
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const upcomingAppointments = [
    { time: "11:00 AM", name: "Rahul Sharma", mode: "Offline", status: "Confirmed" },
    { time: "2:00 PM", name: "Priya Desai", mode: "Offline", status: "Confirmed" },
    { time: "8:00 PM", name: "Amar Patel", mode: "Online", status: "Pending Payment" }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {user?.displayName || "Archana"}!
          </h1>
          <p className="text-gray-600">{formatDate(currentTime)}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-blue-100 text-blue-600 p-2 rounded-full relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
          </button>
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {user?.displayName?.[0] || "A"}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Appointments</p>
              <p className="text-2xl font-bold">{stats.todayAppointments}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Intake Forms</p>
              <p className="text-2xl font-bold">{stats.pendingForms}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">New Clients This Week</p>
              <p className="text-2xl font-bold">{stats.newClients}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Clock size={20} className="mr-2 text-gray-600" /> Today's Schedule
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
            </div>
            
            <div className="divide-y">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 font-medium py-1 px-3 rounded-lg mr-4">
                      {appointment.time}
                    </div>
                    <div>
                      <p className="font-medium">{appointment.name}</p>
                      <p className="text-sm text-gray-500">
                        {appointment.mode} Session
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={`text-xs py-1 px-2 rounded-full ${
                      appointment.status === "Confirmed" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Counseling Information */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <CreditCard size={20} className="mr-2" /> Counseling Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Counselor:</span>
              <span className="font-medium">Archana Mule</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Fees:</span>
              <span className="font-medium">₹1000 (Advance payment)</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Payment:</span>
              <span className="font-medium">GPay: 9823787214</span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Session Timings:</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Offline (Mon–Fri):</span>
                  <p className="text-sm text-gray-600">11:00 AM, 12:30 PM, 2:00 PM, 3:30 PM</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Online (Mon–Fri):</span>
                  <p className="text-sm text-gray-600">8:00 AM & 8:00 PM</p>
                </div>
                <div className="text-sm text-red-600 font-medium">
                  Closed on Saturday & Sunday
                </div>
              </div>
            </div>
            
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors">
              Schedule New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;