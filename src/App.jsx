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

  // consent state: whether the user has previously accepted the disclaimer
  const [consentAccepted, setConsentAccepted] = useState(() => {
    try{
      return localStorage.getItem('consentAccepted') === 'true';
    }catch(e){ return false }
  });
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(()=> saveState({...store, currentSession: current}), [store, current]);
  useEffect(()=> {
    try{ localStorage.setItem('consentAccepted', consentAccepted ? 'true' : 'false'); }catch(e){}
  }, [consentAccepted]);

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

  function handleAcceptConsent(){
    if(!consentChecked){
      alert('请先勾选“我已阅读并同意”以继续');
      return;
    }
    setConsentAccepted(true);
  }

  return (
    <div className="app" aria-hidden={consentAccepted ? 'false' : 'true'}>
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

      {/* Consent modal (force before play) */}
      {!consentAccepted && (
        <div className="consent-modal-overlay" role="dialog" aria-modal="true">
          <div className="consent-modal">
            <h3>免责声明与使用须知</h3>
            <div className="muted" style={{marginTop:8}}>
              本产品为虚拟角色扮演体验，部分内容基于公开资料拟人化生成，仅供个人娱乐与情感代入使用。请理智游玩，尊重名誉与肖像权。不得私自用于盈利或宣传。若使用真实明星素材，请遵守相关法律与许可要求。
            </div>

            <div style={{marginTop:12}}>
              <label style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="checkbox" checked={consentChecked} onChange={e=>setConsentChecked(e.target.checked)} />
                <span className="small">我已阅读并同意以上免责声明</span>
              </label>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14}}>
              <div style={{fontSize:12,color:'#6b7280'}}>（同意后本地保存，支持后续体验）</div>
              <div style={{display:'flex',gap:8}}>
                <button className="select" onClick={()=>{ alert('必须同意免责声明才能开始。如需退出，请关闭页面。'); }}>拒绝并退出</button>
                <button className="btn" onClick={handleAcceptConsent} disabled={!consentChecked}>同意并继续</button>
              </div>
            </div>

            <div className="consent-modal-creator">创作者：残烛海</div>
          </div>
        </div>
      )}
    </div>
  );
}
