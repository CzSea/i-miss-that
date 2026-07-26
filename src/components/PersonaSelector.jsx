import React, { useState } from "react";

export default function PersonaSelector({ personas = [], onSelect, validateAndStart }) {
  const [selected, setSelected] = useState(personas[0]?.id || "");
  const [useImage, setUseImage] = useState("yes");

  function handleStart() {
    if (validateAndStart) validateAndStart({ selected, useImage });
    if (onSelect) onSelect(selected);
  }

  return (
    <div>
      <div>
        <label style={{display:'block', marginBottom:8}}>选择角色</label>
        <select value={selected} onChange={(e) => { setSelected(e.target.value); if(onSelect) onSelect(e.target.value); }}>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{marginTop:12}}>
        <label style={{display:'block', marginBottom:8}}>图片使用</label>
        <select value={useImage} onChange={(e) => setUseImage(e.target.value)}>
          <option value="yes">是（仅本地 & 非商业演示）</option>
          <option value="no">否（改用占位或上传）</option>
        </select>
      </div>

      <div style={{marginTop:12}}>
        <button className="btn" onClick={handleStart}>开始</button>
      </div>

      <div style={{marginTop:12}} className="muted">
        自动检索图片仅用于演示与本地预览；上线公开使用前请核对图片许可与肖像权，或改用用户上传/授权素材。
      </div>
    </div>
  );
}
