import React, { useState } from 'react';
import PDQ8Page from './PDQ8Page';
import { supabase } from './supabase';

var FONT = "'Press Start 2P', monospace, 'Noto Sans Thai', sans-serif";

var HATS = [
  { id: 0, label: 'หมวกสาน' },
  { id: 1, label: 'หมวกแก๊ป' },
  { id: 2, label: 'ไม่สวมหมวก' },
];

var OUTFITS = [
  { id: 0, label: 'ชุดน้ำเงิน' },
  { id: 1, label: 'ชุดเขียว' },
  { id: 2, label: 'ชุดดำ' },
];

var SHOES = [
  { id: 0, label: 'น้ำตาล' },
  { id: 1, label: 'ดำ' },
  { id: 2, label: 'ครีม' },
];

var C = {
  text:'#3D2010', sub:'#A07850',
  orange:'#F4956A', orangeLight:'#FFF0E8', orangeDark:'#C05E35',
  purple:'#A78BFA', purpleLight:'#FAF5FF', purpleDark:'#7C3AED',
  green:'#5DCAA5', greenLight:'#F0FDFA', greenDark:'#0D9488',
  yellow:'#F9C784', yellowLight:'#FEF3C7', yellowDark:'#D4900A',
  blue:'#93C5FD', blueLight:'#EFF6FF', blueDark:'#2563EB',
  pink:'#F9A8D4', pinkLight:'#FDF2F8', pinkDark:'#DB2777',
};

function pxBox(bc,sd,sl,drop) {
  return { background:'#fff', border:'4px solid '+bc, borderRadius:0,
    boxShadow:'inset -3px -3px 0 '+sd+', inset 3px 3px 0 '+sl+', 4px 4px 0 '+drop };
}

function SpriteImg(props) {
  var hat=props.hat, outfit=props.outfit, shoes=props.shoes, height=props.height||140;
  var gender=props.gender||'boy';
  var folder = gender==='girl' ? 'sprites-girl' : 'sprites-boy';
  var src = process.env.PUBLIC_URL+'/'+folder+'/sprite_h'+hat+'_o'+outfit+'_s'+shoes+'.png';
  return React.createElement('img',{
    src:src, alt:'character',
    style:{ height:height, width:'auto', imageRendering:'pixelated', display:'block', margin:'0 auto' }
  });
}

function GenderToggle(props) {
  var gender=props.gender, onChange=props.onChange;
  var isGirl = gender==='girl';
  return React.createElement('div',{
    style:{ display:'flex', gap:0, marginBottom:16, border:'3px solid #1a1a1a',
      boxShadow:'3px 3px 0 #1a1a1a', width:'100%' }
  },
    ['boy','girl'].map(function(g) {
      var active = gender===g;
      var emoji = g==='boy' ? '\u{1F466}' : '\u{1F467}';
      var label = g==='boy' ? 'BOY ชาย' : 'GIRL หญิง';
      var bg = active ? (g==='girl' ? C.pink : C.blue) : '#FAF9F8';
      var color = active ? '#fff' : C.sub;
      var border = g==='girl' ? C.pinkDark : C.blueDark;
      return React.createElement('button',{
        key:g, onClick:function(){ onChange(g); },
        style:{
          flex:1, padding:'10px 8px', fontFamily:FONT, fontSize:10, cursor:'pointer',
          background:bg, color:color, borderRadius:0, border:'none',
          borderRight: g==='boy' ? '2px solid #1a1a1a' : 'none',
          boxShadow: active ? 'inset 0 -3px 0 '+(g==='girl'?C.pinkDark:C.blueDark) : 'none',
          display:'flex', flexDirection:'column', alignItems:'center', gap:4,
          transition:'background 0.15s',
        }
      },
        React.createElement('span',{ style:{ fontSize:20 } }, emoji),
        React.createElement('span',{}, label)
      );
    })
  );
}

function PickerCard(props) {
  var active=props.active;
  return React.createElement('button',{
    onClick:props.onClick,
    style:{
      padding:'10px 6px 8px', cursor:'pointer', fontFamily:FONT, fontSize:9,
      border:'3px solid '+(active?'#1a1a1a':'#C8B8A8'),
      background:active?'#FFF8F0':'#FAFAF8',
      color:active?'#1a1a1a':C.sub,
      boxShadow:active?'3px 3px 0 #1a1a1a':'2px 2px 0 #C0B0A0',
      borderRadius:0, display:'flex', flexDirection:'column', alignItems:'center',
      gap:6, transform:active?'translate(-1px,-1px)':'none',
      width:'100%', minHeight:120, justifyContent:'flex-end', position:'relative',
    }
  },
    active && React.createElement('div',{
      style:{ position:'absolute', top:4, right:4, background:'#1a1a1a', color:'#fff', fontSize:8, padding:'2px 4px', fontFamily:FONT }
    },'OK'),
    props.children,
    React.createElement('span',{ style:{ lineHeight:1.6, textAlign:'center' } }, props.label)
  );
}

function SectionLabel(props) {
  return React.createElement('div',{ style:{ display:'flex', alignItems:'center', gap:10, marginBottom:10 } },
    React.createElement('div',{
      style:{ background:props.color, padding:'5px 8px', border:'2px solid rgba(0,0,0,0.15)', fontSize:14, lineHeight:1 }
    }, props.emoji),
    React.createElement('span',{ style:{ fontFamily:FONT, fontSize:12, fontWeight:700, color:C.text } }, props.title)
  );
}

export default function ProfilePage(props) {
  var profile=props.profile, setProfile=props.setProfile;
  var authUser=props.authUser;
  var pdq8Done=props.pdq8Done, pdq8Score=props.pdq8Score;
  var onPdq8Complete=props.onPdq8Complete, onLogout=props.onLogout;

  var tabState = useState('dress');
  var tab = tabState[0], setTab = tabState[1];
  var flashState = useState(false);
  var saveFlash = flashState[0], setSaveFlash = flashState[1];

  var gender = profile.spriteGender != null ? profile.spriteGender : 'boy';

  // Draft state for dress tab — only committed when Save is pressed
  var draftState = useState(function() {
    return {
      hat:    profile.spriteHat    != null ? profile.spriteHat    : 0,
      outfit: profile.spriteOutfit != null ? profile.spriteOutfit : 0,
      shoes:  profile.spriteShoes  != null ? profile.spriteShoes  : 0,
    };
  });
  var draft = draftState[0], setDraft = draftState[1];

  // Saved values (shown in header)
  var hat    = profile.spriteHat    != null ? profile.spriteHat    : 0;
  var outfit = profile.spriteOutfit != null ? profile.spriteOutfit : 0;
  var shoes  = profile.spriteShoes  != null ? profile.spriteShoes  : 0;

  function update(key, val) {
    var next = Object.assign({}, profile, { [key]: val });
    setProfile(next);
    localStorage.setItem('profile', JSON.stringify(next));
  }

  function saveDress() {
    var next = Object.assign({}, profile, {
      spriteHat:    draft.hat,
      spriteOutfit: draft.outfit,
      spriteShoes:  draft.shoes,
    });
    setProfile(next);
    localStorage.setItem('profile', JSON.stringify(next));
    setSaveFlash(true);
    setTimeout(function(){ setSaveFlash(false); }, 2000);
  }

  function saveAll() {
    localStorage.setItem('profile', JSON.stringify(profile));
    // sync ชื่อขึ้น Supabase เพื่อให้แพทย์เห็น
    if (authUser && profile.name) {
      supabase
        .from('profiles')
        .update({ name: profile.name })
        .eq('id', authUser.id)
        .then(function() {});
    }
    setSaveFlash(true);
    setTimeout(function(){ setSaveFlash(false); }, 2000);
  }

  return (
    <div style={{ fontFamily:FONT }}>

      {/* Header card */}
      <div style={Object.assign({},pxBox(C.purple,'#DDD6FE','#FAF5FF',C.purpleDark),{
        padding:'18px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:18,
      })}>
        <div style={{ border:'3px solid '+C.purpleDark, background:'#F3EEFF', padding:'8px 10px', boxShadow:'2px 2px 0 '+C.purpleDark, flexShrink:0 }}>
          <SpriteImg hat={hat} outfit={outfit} shoes={shoes} gender={gender} height={64} />
        </div>
        <div>
          <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:C.text, fontFamily:FONT, lineHeight:2 }}>
            {profile.name || '(ยังไม่มีชื่อ)'}
          </h2>
          <p style={{ margin:0, fontSize:10, color:C.sub, fontFamily:FONT }}>
            แต่งตัวละครของคุณ
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { key:'dress', label:'WEAR แต่งตัว' },
          { key:'info',  label:'INFO ข้อมูล'  },
          { key:'pdq8',  label: pdq8Done ? 'PDQ-8 OK' : 'PDQ-8' },
        ].map(function(t) {
          return (
            <button key={t.key} onClick={function(){ setTab(t.key); }} style={{
              padding:'12px 18px', borderRadius:0, fontFamily:FONT, cursor:'pointer', fontSize:11,
              border:'3px solid '+(tab===t.key?C.orangeDark:C.orange),
              background:tab===t.key?C.orange:C.orangeLight,
              color:tab===t.key?'#fff':C.orangeDark,
              boxShadow:tab===t.key?'3px 3px 0 #8B3A1A':'none',
            }}>{t.label}</button>
          );
        })}
      </div>

      {tab==='dress' && (
        <div>
          {/* Live preview — shows draft (unsaved) values */}
          <div style={Object.assign({},pxBox(gender==='girl'?C.pink:C.orange, gender==='girl'?'#FBB9D7':'#FFD4B8', gender==='girl'?'#FDF2F8':'#FFF5EE', gender==='girl'?C.pinkDark:C.orangeDark),{
            padding:'28px 20px 20px', marginBottom:20,
            display:'flex', flexDirection:'column', alignItems:'center', gap:14,
            background: gender==='girl'
              ? 'linear-gradient(180deg,#FFF5FB 60%,#FFD6EC 100%)'
              : 'linear-gradient(180deg,#FFF8F2 60%,#FFE8D4 100%)',
            position:'relative', overflow:'hidden',
          })}>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:8,
              backgroundImage:'repeating-linear-gradient(90deg,'+(gender==='girl'?C.pink:C.orange)+' 0px,'+(gender==='girl'?C.pink:C.orange)+' 8px,transparent 8px,transparent 16px)',
              opacity:0.3 }} />
            <SpriteImg hat={draft.hat} outfit={draft.outfit} shoes={draft.shoes} gender={gender} height={220} />
            <div style={{ textAlign:'center', padding:'8px 16px', border:'2px solid '+(gender==='girl'?C.pink:C.orange), background:gender==='girl'?C.pinkLight:C.orangeLight }}>
              <p style={{ margin:0, fontSize:10, fontFamily:FONT, color:gender==='girl'?C.pinkDark:C.orangeDark, lineHeight:2 }}>
                {HATS[draft.hat].label} | {OUTFITS[draft.outfit].label} | {SHOES[draft.shoes].label}
              </p>
            </div>
          </div>

          {/* Hat picker */}
          <div style={Object.assign({},pxBox(C.yellow,'#FDE9B8','#FFFDF5',C.yellowDark),{ padding:16, marginBottom:12 })}>
            <SectionLabel emoji={'👒'} title='HATS หมวก' color={C.yellowLight} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {HATS.map(function(h){
                return (
                  <PickerCard key={h.id} label={h.label} active={draft.hat===h.id}
                    onClick={function(){ setDraft(function(d){ return Object.assign({},d,{hat:h.id}); }); }}>
                    <SpriteImg hat={h.id} outfit={draft.outfit} shoes={draft.shoes} gender={gender} height={90} />
                  </PickerCard>
                );
              })}
            </div>
          </div>

          {/* Outfit picker */}
          <div style={Object.assign({},pxBox(C.blue,'#BFDBFE','#EFF6FF',C.blueDark),{ padding:16, marginBottom:12 })}>
            <SectionLabel emoji={'👕'} title='OUTFIT ชุด' color={C.blueLight} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {OUTFITS.map(function(o){
                return (
                  <PickerCard key={o.id} label={o.label} active={draft.outfit===o.id}
                    onClick={function(){ setDraft(function(d){ return Object.assign({},d,{outfit:o.id}); }); }}>
                    <SpriteImg hat={draft.hat} outfit={o.id} shoes={draft.shoes} gender={gender} height={90} />
                  </PickerCard>
                );
              })}
            </div>
          </div>

          {/* Shoes picker */}
          <div style={Object.assign({},pxBox(C.green,'#CCFBF1','#F0FDFA',C.greenDark),{ padding:16, marginBottom:12 })}>
            <SectionLabel emoji={'👟'} title='SHOES รองเท้า' color={C.greenLight} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {SHOES.map(function(s){
                return (
                  <PickerCard key={s.id} label={s.label} active={draft.shoes===s.id}
                    onClick={function(){ setDraft(function(d){ return Object.assign({},d,{shoes:s.id}); }); }}>
                    <SpriteImg hat={draft.hat} outfit={draft.outfit} shoes={s.id} gender={gender} height={90} />
                  </PickerCard>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab==='info' && (
        <div>
          <div style={Object.assign({},pxBox(C.purple,'#DDD6FE','#FAF5FF',C.purpleDark),{ padding:20, marginBottom:16 })}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
              <SpriteImg hat={hat} outfit={outfit} shoes={shoes} gender={gender} height={150} />
            </div>
            {[
              { label:'ชื่อ', key:'name', ph:'ชื่อของคุณ', type:'text' },
              { label:'อายุ', key:'age',  ph:'อายุ (ปี)',  type:'number' },
            ].map(function(f) {
              return (
                <div key={f.key} style={{ marginBottom:16 }}>
                  <label style={{ fontSize:11, color:C.sub, display:'block', marginBottom:7, fontFamily:FONT }}>{f.label}</label>
                  <input value={profile[f.key]||''}
                    onChange={function(e){ update(f.key, e.target.value); }}
                    placeholder={f.ph} type={f.type}
                    style={{ width:'100%', background:'#FFF5FF', border:'3px solid '+C.purple, borderRadius:0,
                      padding:'10px 14px', color:C.text, fontSize:14, boxSizing:'border-box',
                      fontFamily:'inherit', boxShadow:'inset 2px 2px 0 #DDD6FE' }}
                  />
                </div>
              );
            })}
            {/* Small gender selector */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, color:C.sub, display:'block', marginBottom:7, fontFamily:FONT }}>เพศ</label>
              <div style={{ display:'flex', gap:8 }}>
                {['boy','girl'].map(function(g) {
                  var active = gender===g;
                  var emoji  = g==='boy' ? '👦' : '👧';
                  var label  = g==='boy' ? 'ชาย' : 'หญิง';
                  var accent = g==='girl' ? C.pinkDark : C.blueDark;
                  var bgA    = g==='girl' ? C.pink     : C.blue;
                  return React.createElement('button',{
                    key:g, onClick:function(){ update('spriteGender',g); },
                    style:{
                      padding:'5px 12px', fontFamily:FONT, fontSize:9, cursor:'pointer',
                      background:active?bgA:'#FAF9F8',
                      color:active?'#fff':C.sub, borderRadius:0,
                      border:'2px solid '+(active?accent:'#C8B8A8'),
                      boxShadow:active?'2px 2px 0 '+accent:'none',
                      display:'flex', alignItems:'center', gap:5,
                    }
                  },
                    React.createElement('span',{ style:{ fontSize:16 } }, emoji),
                    React.createElement('span',{}, label)
                  );
                })}
              </div>
            </div>
            {authUser && (
              <div style={{ fontSize:10, color:C.sub, marginBottom:4, fontFamily:FONT }}>Email: {authUser.email}</div>
            )}
          </div>
          <button onClick={onLogout} style={{ width:'100%', padding:14, fontFamily:FONT, fontSize:11,
            border:'3px solid #FCA5A5', borderRadius:0, background:'#FFF5F5', color:'#DC2626',
            cursor:'pointer', boxShadow:'3px 3px 0 #DC2626', marginTop:8 }}>
            LOGOUT ออกจากระบบ
          </button>
        </div>
      )}

      {tab==='pdq8' && (
        <div>
          {pdq8Done ? (
            <div>
              <div style={Object.assign({},pxBox(C.green,'#A7F3D0','#F0FDFA',C.greenDark),{ padding:20, marginBottom:16, textAlign:'center' })}>
                <p style={{ margin:'0 0 8px', fontSize:12, color:C.greenDark, fontFamily:FONT }}>OK แบบสอบถาม</p>
                <p style={{ margin:'0 0 4px', fontSize:10, color:C.sub, fontFamily:FONT }}>PDQ-8 Score</p>
                <p style={{ margin:0, fontSize:32, fontWeight:700, color:C.greenDark, fontFamily:FONT }}>{pdq8Score!=null?pdq8Score:'-'}</p>
                <p style={{ margin:'6px 0 0', fontSize:9, color:C.sub, fontFamily:FONT }}>/ 100</p>
              </div>
              <button onClick={function(){ setTab('pdq8-redo'); }} style={{ width:'100%', padding:14, fontFamily:FONT, fontSize:11,
                border:'3px solid '+C.orange, background:C.orangeLight, color:C.orangeDark,
                cursor:'pointer', boxShadow:'3px 3px 0 '+C.orangeDark }}>REDO ทำใหม่</button>
            </div>
          ) : (
            <PDQ8Page user={authUser} onComplete={function(score){ onPdq8Complete(score); setTab('pdq8'); }} />
          )}
        </div>
      )}

      {tab==='pdq8-redo' && (
        <PDQ8Page user={authUser} onComplete={function(score){ onPdq8Complete(score); setTab('pdq8'); }} />
      )}

      {tab!=='pdq8' && tab!=='pdq8-redo' && (
        <button onClick={tab==='dress' ? saveDress : saveAll}
          style={{ width:'100%', padding:'16px', marginTop:10,
            background:saveFlash?C.green:C.orange, color:'#fff', fontFamily:FONT, fontSize:13,
            border:'3px solid '+(saveFlash?C.greenDark:C.orangeDark), borderRadius:0, cursor:'pointer',
            boxShadow:'4px 4px 0 '+(saveFlash?C.greenDark:'#8B3A1A'), transition:'background 0.3s' }}>
          {saveFlash ? '✓ SAVED!' : 'SAVE บันทึก'}
        </button>
      )}

    </div>
  );
}
