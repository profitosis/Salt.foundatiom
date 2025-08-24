import React, { useEffect, useState } from "react";
import JokeMiner from "../components/JokeMiner";
import SaltCard from "../components/SaltCard";
export default function Home() {
  const [jokes, setJokes] = useState([]);
  useEffect(() => {
    const evtSource = new EventSource("/api/jokes/stream");
    evtSource.onmessage = (event) => {
      setJokes((prev) => [event.data, ...prev]);
    };
    return () => evtSource.close();
  }, []);
  return (
    <div className="container">
      <h1>⚡ Salt Kitchen</h1>
      <SaltCard />
      <JokeMiner jokes={jokes} />
    </div>
  );
}