import React from 'react';

export default function TestScrollbarSimple() {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-2xl text-white mb-8">Scrollbar Test Page</h1>

      {/* Test 1: Basic div with overflow-y-scroll */}
      <div className="mb-8">
        <h2 className="text-white mb-2">Test 1: Basic overflow-y-scroll (FORCED)</h2>
        <div
          className="border-2 border-red-500 bg-gray-800 p-4"
          style={{
            height: '200px',
            overflowY: 'scroll',
            width: '300px'
          }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="text-white py-2">
              Item {i + 1} - This should force a scrollbar
            </div>
          ))}
        </div>
      </div>

      {/* Test 2: Using overflow-y-auto */}
      <div className="mb-8">
        <h2 className="text-white mb-2">Test 2: overflow-y-auto (only when needed)</h2>
        <div
          className="border-2 border-blue-500 bg-gray-800 p-4"
          style={{
            height: '200px',
            overflowY: 'auto',
            width: '300px'
          }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="text-white py-2">
              Item {i + 1} - Auto scrollbar
            </div>
          ))}
        </div>
      </div>

      {/* Test 3: With custom scrollbar CSS */}
      <div className="mb-8">
        <h2 className="text-white mb-2">Test 3: Custom styled scrollbar</h2>
        <style>{`
          .custom-scroll::-webkit-scrollbar {
            width: 16px !important;
            height: 16px !important;
            background: red !important;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: yellow !important;
            border-radius: 8px !important;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: blue !important;
            border-radius: 8px !important;
            border: 2px solid white !important;
          }
          .custom-scroll {
            scrollbar-width: thick !important;
            scrollbar-color: blue yellow !important;
          }
        `}</style>
        <div
          className="custom-scroll border-2 border-green-500 bg-gray-800 p-4"
          style={{
            height: '200px',
            overflowY: 'scroll',
            width: '300px'
          }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="text-white py-2">
              Item {i + 1} - Custom styled
            </div>
          ))}
        </div>
      </div>

      {/* Test 4: Your exact CommandList setup */}
      <div className="mb-8">
        <h2 className="text-white mb-2">Test 4: Simulating CommandList</h2>
        <div
          className="border-2 border-purple-500 bg-gray-800"
          style={{
            maxHeight: '200px',
            overflowY: 'scroll',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="p-4">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="text-white py-2 hover:bg-white/10 px-2">
                CommandItem {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-600/20 rounded">
        <p className="text-yellow-200">
          If you can see scrollbars in ANY of the above tests, then scrollbars DO work in your browser.
        </p>
        <p className="text-yellow-200 mt-2">
          If NONE show scrollbars, check: System Preferences → General → Show scroll bars → Set to "Always"
        </p>
      </div>
    </div>
  );
}