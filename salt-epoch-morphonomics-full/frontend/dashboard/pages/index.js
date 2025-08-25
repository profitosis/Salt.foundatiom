import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import JokeMiner from "../components/JokeMiner";
import SaltCard from "../components/SaltCard";

// Dynamically import the PromptScroll component with SSR disabled
const PromptScroll = dynamic(
  () => import('../components/PromptScroll'),
  { ssr: false }
);

export default function Home() {
  const [jokes, setJokes] = useState([]);
  const [activeTab, setActiveTab] = useState('jokes');

  useEffect(() => {
    const evtSource = new EventSource("/api/jokes/stream");
    evtSource.onmessage = (event) => {
      setJokes((prev) => [event.data, ...prev]);
    };
    return () => evtSource.close();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">⚡ Salt Kitchen</h1>
      
      <div className="mb-6">
        <SaltCard />
      </div>
      
      <div className="mb-6">
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'jokes' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('jokes')}
          >
            Joke Miner
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'prompts' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('prompts')}
          >
            Prompt Scroll
          </button>
        </div>
        
        {activeTab === 'jokes' ? (
          <JokeMiner jokes={jokes} />
        ) : (
          <PromptScroll />
        )}
      </div>
    </div>
  );
}