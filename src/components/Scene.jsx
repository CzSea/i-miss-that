import React, { useMemo, useState, useEffect } from "react";
import scenesData from "../data/scenes.json";

function clamp(x,min,max){return Math.max(min,Math.min(max,x))}

export default function Scene({session, persona, onUpdate, onEnd}) {
  const [idx, setIdx] = useState(0);
  const [targetScenes, setTargetScenes] = useState(() => computeTarget(session.intimacy, 0));
  const [hoverPreview, setHoverPreview] = useState(null); // {minDelta, maxDelta}

  const pool = useMemo(()=>{
    const tags = new Set(persona?.tags || []);
    const list = scenesData.filter(s => s.tags.length === 0 || s.tags.some(t=>tags.has(t)));
    return list.length ? list : scenesData;
  }, [persona?.id]);

  useEffect(()=>{
    const computed = computeTarget(session.intimacy, idx);
    setTargetScenes(prev => Math.max(prev, computed, 10, idx));
  }, [session.intimacy, idx]);

  useEffect(()=>{
    if(idx >= targetScenes && targetScenes > 0){
      const t = setTimeout(()=> tryEnding(), 300);
      return ()=>clearTimeout(t);
    }
  }, [idx, targetScenes]);

  const scene = pool[idx % pool.length];

  function choose(choice){
    let delta = choice.intimacy || 0;
    if(choice.backfireChance){
      if(Math.random() < choice.backfireChance){
        delta += (choice.backfirePenalty || -8);
      }
    }
    if(Math.random() < (scene.randomEventProb||0)){
      const evDelta = (Math.random() < 0.5 ? -5 : +5);
      onUpdate(prev => {
        const nextIntimacy = clamp(prev.intimacy + delta + evDelta, 0, 100);
        return {...prev, history: [...prev.history, {type:"event", text:"突发事件改变了氛围", delta: evDelta}], intimacy: nextIntimacy};
      });
    }else{
      onUpdate(prev => {
        const nextIntimacy = clamp(prev.intimacy + delta,0,100);
        return {...prev, history: [...prev.history, {type:"turn", sceneId:scene.id, choice:choice.id, text:choice.text}], intimacy: nextIntimacy};
      });
    }
    setIdx(i=>i+1);
    setHoverPreview(null);
  }

  function tryEnding(){
    const i = session.intimacy;
    if(i < 20) onEnd("冷静结局");
    else if(i < 45) onEnd("暖心结局");
    else if(i < 80) onEnd("甜蜜结局");
    else onEnd("深度绑定结局");
  }

  // compute avatar/background style
  const bgStyle = persona?.imageUrl && (session.identity?.useImage !== false)
    ? { backgroundImage: `url(${persona.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius:12, minHeight:120, color:"#fff", padding:12 }
    : null;

  // preview widths
  const currentWidth = clamp(session.intimacy,0,100);
  const previewWidth = hoverPreview ? clamp(session.intimacy + hoverPreview.maxDelta,0,100) : currentWidth;

  return (
    <div className="scene">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div className="persona-card" style={{flex:1}}>
          { bgStyle ? (
            <div style={{display:"flex",gap:12,alignItems:"flex-start",flex:1}}>
              <div style={{flex:1}}>
                <div style={bgStyle}>
                  <div style={{fontWeight:700, textShadow:"0 2px 8px rgba(0,0,0,0.4)"}}>{persona?.name}</div>
                  <div className="small" style={{textShadow:"0 1px 6px rgba(0,0,0,0.3)"}}>{persona?.bio}</div>
                </div>
                <div className="small muted" style={{marginTop:6}}>
                  图片来源：{persona?.sourcePageUrl ? (<a href={persona.sourcePageUrl} target="_blank" rel="noreferrer">查看许可与作者</a>) : '无'}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="persona-avatar">{persona?.name ? persona.name[0] : '偶'}</div>
              <div>
                <div style={{fontWeight:700}}>{persona?.name} <span className="muted">({session.identity.type})</span></div>
                <div className="muted">{persona?.bio}</div>
              </div>
            </>
          )}
        </div>

        <div style={{width:260}}>
          <div className="small">亲密度</div>
          <div style={{height:8, background:'#eee', borderRadius:4, marginTop:6}}>
            <div style={{width:`${currentWidth}%`, height:'100%', background:'#ff9f1c', borderRadius:4}} />
          </div>
        </div>
      </div>

      <div style={{marginTop:16}}>
        <div className="scene-text">{scene?.text}</div>
        <div className="choices" style={{marginTop:12, display:'flex', flexDirection:'column', gap:8}}>
          {scene?.choices?.map(c => (
            <button key={c.id} onClick={()=>choose(c)} onMouseEnter={()=>setHoverPreview({maxDelta:c.intimacy||0})} onMouseLeave={()=>setHoverPreview(null)}>
              {c.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// helper used above but originally referenced; provide a simple fallback implementation
function computeTarget(intimacy, idx){
  // naive heuristic: require at least 5 scenes plus one per 20 intimacy
  const base = 5;
  return base + Math.floor((intimacy||0)/20) + (idx||0);
}
