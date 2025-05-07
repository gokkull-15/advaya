import React from 'react';
import { FaMapPin } from 'react-icons/fa';
import BG from "./assets/image.png";

function TaskDetails() {
  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${BG})` }}>
      <div className="bg-black bg-opacity-60 min-h-screen">
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
            {/* Header Block */}
            <div className="border-b border-gray-600 pb-6 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white aclonica-regular">Complaint Details</h2>
                <span className="px-4 py-2 bg-yellow-500 bg-opacity-20 text-yellow-200 rounded-full text-sm font-medium vt323-regular">Medium Priority</span>
              </div>
              <p className="text-sm text-gray-300 mt-2 vt323-regular">Tracking ID: COMP-76U2W8F0J</p>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {/* Description Block */}
              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3 aclonica-regular">Description</h3>
                <p className="text-gray-200 vt323-regular">The complaint involves noise disturbance from a nearby construction site during prohibited hours.</p>
              </div>

              {/* Location Block */}
              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3 aclonica-regular">Location</h3>
                <div className="flex items-start gap-2">
                  <FaMapPin className="text-gray-300 mt-1" />
                  <p className="text-gray-200 vt323-regular">No.36, South Alley, Chennai - 600028</p>
                </div>
              </div>

              {/* Complainant Block */}
              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3 aclonica-regular">Complainant Information</h3>
                <p className="text-gray-200 vt323-regular">Mr. Sairam</p>
                <p className="text-gray-300 text-sm mt-1 vt323-regular">jec@gmail.com</p>
                <p className="text-gray-300 text-sm vt323-regular">+91 1234567890</p>
              </div>

              {/* Evidence Block */}
              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3 aclonica-regular">Evidence</h3>
                <div className="flex space-x-4">
                  <div className="border-2 border-dashed border-gray-400 rounded-xl p-4 w-32 h-32 flex items-center justify-center text-gray-300 vt323-regular">
                    Audio Clip
                  </div>
                  <div className="border-2 border-dashed border-gray-400 rounded-xl p-4 w-32 h-32 flex items-center justify-center text-gray-300 vt323-regular">
                    Photo 1
                  </div>
                </div>
              </div>

              {/* Timeline Block */}
              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6 aclonica-regular">Progress Timeline</h3>
                
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-600"></div>
                  
                  {/* Timeline Items */}
                  <div className="space-y-8">
                    {/* Item 1 - Received */}
                    <div className="relative flex gap-4">
                      <div className="flex-shrink-0 z-10">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-10 border border-gray-600 rounded-lg p-4 flex-1">
                        <h4 className="font-semibold text-white aclonica-regular">Complaint Received</h4>
                        <p className="text-sm text-gray-200 mt-1 vt323-regular">Complaint was received and logged in the system</p>
                        <p className="text-xs text-gray-300 mt-2 vt323-regular">TimeStamp</p>
                      </div>
                    </div>

                    {/* Item 2 - AI Processing */}
                    <div className="relative flex gap-4">
                      <div className="flex-shrink-0 z-10">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-10 border border-gray-600 rounded-lg p-4 flex-1">
                        <h4 className="font-semibold text-white aclonica-regular">AI Processing Completed</h4>
                        <p className="text-sm text-gray-200 mt-1 vt323-regular">AI system analyzed the complaint and categorized it</p>
                        <p className="text-xs text-gray-300 mt-2 vt323-regular">TimeStamp</p>
                      </div>
                    </div>

                    {/* Item 3 - Officer Assigned */}
                    <div className="relative flex gap-4">
                      <div className="flex-shrink-0 z-10">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-10 border border-gray-600 rounded-lg p-4 flex-1">
                        <h4 className="font-semibold text-white aclonica-regular">Officer Assigned</h4>
                        <p className="text-sm text-gray-200 mt-1 vt323-regular">Officer Rajesh Kumar assigned to investigate</p>
                        <p className="text-xs text-gray-300 mt-2 vt323-regular">Pending</p>
                      </div>
                    </div>

                    {/* Item 4 - Officer Arrived */}
                    <div className="relative flex gap-4">
                      <div className="flex-shrink-0 z-10">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-10 border border-gray-600 rounded-lg p-4 flex-1">
                        <h4 className="font-semibold text-white aclonica-regular">Officer Arrived</h4>
                        <p className="text-sm text-gray-200 mt-1 vt323-regular">Officer will arrive at the scene</p>
                        <p className="text-xs text-gray-300 mt-2 vt323-regular">Pending</p>
                      </div>
                    </div>

                    {/* Item 5 - Action Taken */}
                    <div className="relative flex gap-4">
                      <div className="flex-shrink-0 z-10">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-10 border border-gray-600 rounded-lg p-4 flex-1">
                        <h4 className="font-semibold text-white aclonica-regular">Action Taken</h4>
                        <p className="text-sm text-gray-200 mt-1 vt323-regular">Resolution details will be provided</p>
                        <p className="text-xs text-gray-300 mt-2 vt323-regular">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TaskDetails;