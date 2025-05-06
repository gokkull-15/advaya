import React from 'react';
import { FiMapPin } from 'react-icons/fi';

function TaskDetails() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header Block */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Complaint Details</h2>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Medium Priority</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Tracking ID: COMP-76U2W8F0J</p>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Description Block */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Description</h3>
            <p className="text-gray-600">The complaint involves noise disturbance from a nearby construction site during prohibited hours.</p>
          </div>

          {/* Location Block */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Location</h3>
            <div className="flex items-start gap-2">
              <FiMapPin className="text-gray-500 mt-1" />
              <p className="text-gray-600">No.36, South Alley, Chennai - 600028</p>
            </div>
          </div>

          {/* Complainant Block */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Complainant Information</h3>
            <p className="text-gray-600">Mr. Sairam</p>
            <p className="text-gray-500 text-sm mt-1">jec@gmail.com</p>
            <p className="text-gray-500 text-sm">+91 1234567890</p>
          </div>

          {/* Evidence Block */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Evidence</h3>
            <div className="flex space-x-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-32 h-32 flex items-center justify-center text-gray-400">
                Audio Clip
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-32 h-32 flex items-center justify-center text-gray-400">
                Photo 1
              </div>
            </div>
          </div>

          {/* Timeline Block */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-6">Progress Timeline</h3>
            
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
              
              {/* Timeline Items */}
              <div className="space-y-8">
                {/* Item 1 - Received */}
                <div className="relative flex gap-4">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex-1">
                    <h4 className="font-semibold text-blue-800">Complaint Received</h4>
                    <p className="text-sm text-gray-600 mt-1">Complaint was received and logged in the system</p>
                    <p className="text-xs text-gray-500 mt-2">TimeStamp</p>
                  </div>
                </div>

                {/* Item 2 - AI Processing */}
                <div className="relative flex gap-4">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex-1">
                    <h4 className="font-semibold text-blue-800">AI Processing Completed</h4>
                    <p className="text-sm text-gray-600 mt-1">AI system analyzed the complaint and categorized it</p>
                    <p className="text-xs text-gray-500 mt-2">TimeStamp</p>
                  </div>
                </div>

                {/* Item 3 - Officer Assigned */}
                <div className="relative flex gap-4">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex-1">
                    <h4 className="font-semibold text-gray-700">Officer Assigned</h4>
                    <p className="text-sm text-gray-600 mt-1">Officer Rajesh Kumar assigned to investigate</p>
                    <p className="text-xs text-gray-500 mt-2">Pending</p>
                  </div>
                </div>

                {/* Item 4 - Officer Arrived */}
                <div className="relative flex gap-4">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex-1">
                    <h4 className="font-semibold text-gray-700">Officer Arrived</h4>
                    <p className="text-sm text-gray-600 mt-1">Officer will arrive at the scene</p>
                    <p className="text-xs text-gray-500 mt-2">Pending</p>
                  </div>
                </div>

                {/* Item 5 - Action Taken */}
                <div className="relative flex gap-4">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex-1">
                    <h4 className="font-semibold text-gray-700">Action Taken</h4>
                    <p className="text-sm text-gray-600 mt-1">Resolution details will be provided</p>
                    <p className="text-xs text-gray-500 mt-2">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;