import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const btcAddress = "bc1qtsmrk0tjme6rwkyagwhwmhqe96ufge7hd470uz"; // Bitcoin address updated

  const copyToClipboard = () => {
    navigator.clipboard.writeText(btcAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Premium Access Payment
        </h1>
        
        <div className="mb-8">
          <img 
            src="/images/btc.jpg" 
            alt="Bitcoin QR Code" 
            className="mx-auto max-w-[300px] rounded-lg shadow-md"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Bitcoin Payment Instructions
            </h2>
            <p className="text-blue-800 mb-4">
              We accept Bitcoin (BTC) payments only. Please follow the instructions below based on your preferred payment method:
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold mb-2">Cash Users (Bitcoin ATM)</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Locate a Bitcoin ATM near you</li>
                <li>Select "Buy Bitcoin" at the ATM</li>
                <li>Scan the QR code above or use the address below</li>
                <li>Insert your cash and confirm the transaction</li>
              </ol>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold mb-2">Credit/Debit Card Users</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Sign up for a cryptocurrency exchange (e.g., Coinbase, Binance)</li>
                <li>Complete the verification process</li>
                <li>Add your card and purchase Bitcoin</li>
                <li>Send Bitcoin to our address below</li>
              </ol>
            </div>

            <div className="mt-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Our Bitcoin Address</h3>
              <div className="flex items-center space-x-4">
                <code className="flex-1 bg-gray-100 p-3 rounded text-sm break-all">
                  {btcAddress}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h3>
              <ul className="list-disc list-inside space-y-2 text-yellow-800">
                <li>We accept Bitcoin (BTC) payments only</li>
                <li>Please double-check the address before sending</li>
                <li>Transaction times may vary based on network congestion</li>
                <li>Contact support if you need assistance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 