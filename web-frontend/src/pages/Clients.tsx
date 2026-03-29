import { useState } from "react";
import dummyClients from "../data/dummyClients";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, ChevronRight, User, Filter } from "lucide-react";

const Clients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter clients based on search term
  const filteredClients = dummyClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
            <p className="text-gray-600">View and manage your client records</p>
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-colors flex items-center"
            onClick={() => navigate("/intake")}
          >
            <UserPlus size={18} className="mr-2" />
            New Client
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter size={18} className="mr-2 text-gray-600" />
              <span>Filters</span>
            </button>
          </div>

          {filterOpen && (
            <div className="mt-4 p-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2">
                    <option value="">All Ages</option>
                    <option value="0-18">0-18</option>
                    <option value="19-30">19-30</option>
                    <option value="31-50">31-50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2">
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2">
                    <option value="">All Issues</option>
                    <option value="Anxiety">Anxiety</option>
                    <option value="Depression">Depression</option>
                    <option value="Stress">Stress</option>
                    <option value="Relationships">Relationships</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Client List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-500">
            {filteredClients.length} Clients
          </div>
          
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-gray-500">
              <User size={40} className="mb-4 text-gray-400" />
              <p className="text-lg font-medium">No clients found</p>
              <p className="mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <li
                  key={client.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div className="px-6 py-4 flex items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-4">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800">{client.name}</h2>
                          <div className="mt-1 flex flex-wrap items-center text-sm text-gray-600 gap-x-4">
                            <span>{client.age} years</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{client.gender}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {client.issues.map((issue, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;