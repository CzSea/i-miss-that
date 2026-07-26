                <option value="yes">是（仅本地 & 非商业演示）</option>
                  <option value="no">否（改用占位或上传）</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{marginTop:12}}>
        <button className="btn" onClick={validateAndStart}>开始</button>
      </div>

      <div style={{marginTop:12}} className="muted">
        自动检索图片仅用于演示与本地预览；上线公开使用前请核对图片许可与肖像权，或改用用户上传/授权素材。
      </div>
    </div>
  );
}
