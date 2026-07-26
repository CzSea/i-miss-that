import React, { useEffect, useState } from "react";
import personasData from "./data/personas.json";
import Scene from "./components/Scene";
import PersonaSelector from "./components/PersonaSelector";

const STORAGE_KEY = "star_rp_v1";

function loadState(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  }catch(e){ return {} }
}
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

export default function App(){
  const [store, setStore] = useState(loadState());
  const [personas, setPersonas] = useState(personasData);
  const [current, setCurrent] = useState(store.currentSession || null);

  useEffect(()=> saveState({...store, currentSession: current}), [store, current]);

  function startSession(personaId, identity, userProfile){
    const persona = personas.find(p=>p.id===personaId) || (identity && identity.customPersona) || null;
    const s = {
      id: Date.now().toString(),
      personaId,
      personaSnapshot: persona ? {...persona} : null,
      identity,
      userProfile: userProfile || {},
      intimacy: 40,
      history: [],
      unlockedEndings: store.unlockedEndings || []
    };
    setCurrent(s);
    setStore(prev=> ({...prev, lastSessionId:s.id, sessions: {...(prev.sessions||{}), [s.id]:s}}));
  }

  function updateSession(updater){
    setCurrent(prev => {
      const next = typeof updater === "function" ? updater(prev) : {...prev, ...updater};
      setStore(prevStore=> ({...prevStore, sessions: {...(prevStore.sessions||{}), [next.id]: next}}));
      return next;
    });
  }

  function endAndSave(ending){
    const unlocked = Array.from(new Set([...(store.unlockedEndings||[]), ending]));
    setStore(prev=> ({...prev, unlockedEndings: unlocked}));
    setCurrent(null);
  }

  return (
    <div className="app">
      <div className="header">
        <div className="logo">SR</div>
        <div>
          <div style={{fontWeight:700}}>我想念的那个ta</div>
          <div className="muted">温馨、可自定义身份、实时亲密度预览、支持多结局与重玩</div>
        </div>
      </div>

      <div className="card">
        {!current ? (
          <div>
            <h3>开始新游玩</h3>
            <PersonaSelector personas={personas} onStart={(pid, identity, userProfile)=>{
              if(identity?.customPersona && identity.customPersona.id === "p-custom"){
                const cp = identity.customPersona;
                cp.id = `p-custom-${Date.now()}`;
                setPersonas(prev => [cp, ...prev]);
                pid = cp.id;
                identity = {...identity, customPersonaId: cp.id, customPersona: undefined};
              }
              startSession(pid, identity, userProfile);
            }} />
            <div style={{marginTop:12}}>
              <button className="btn" onClick={()=>{
                localStorage.removeItem(STORAGE_KEY);
                setStore({}); setCurrent(null);
                alert("本地存档已清除");
              }}>清除本地存档</button>
            </div>
            <div style={{marginTop:12}} className="small">提示：这是本地保存的演示版，不上传云端，适合 0 成本迭代体验。</div>
          </div>
        ) : (
          <Scene
            session={current}
            persona={personas.find(p=>p.id===current.personaId) || current.personaSnapshot}
            onUpdate={updateSession}
            onEnd={endAndSave}
          />
        )}
      </div>

      <div className="card" style={{marginTop:12}}>
        <h4>已解锁结局（演示）</h4>
        <div className="small">{(store.unlockedEndings||[]).length ? (store.unlockedEndings||[]).join("、") : "暂无已解锁结局（玩一局试试）"}</div>
      </div>

      {/* 右下角创作者与免责声明 */}
      <div className="corner-badge" role="note" aria-label="创作者与免责声明">
        <div className="creator">创作者：残烛海</div>
        <div className="disclaimer">内容纯虚构，请理智游玩，不得私自用以盈利</div>
      </div>
    </div>
  );
}
