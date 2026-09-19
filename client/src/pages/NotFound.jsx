import { useNavigate } from "react-router-dom";
import { ArrowRight, FileQuestion, Home, Search } from "lucide-react";
import PathTopBar from "../components/PathTopBar";
import PathFooter from "../components/PathFooter";

export default function NotFound() {
  const navigate = useNavigate();

  const handleHome = () => navigate("/dashboard");
  const handleHelpDesk = () => navigate("/helpdesk");

  return (
    <main className="path-not-found">
      <style>{`
        .path-not-found{position:relative;display:flex;min-height:100svh;flex-direction:column;overflow:hidden;background:#f8f7ff;color:#33293c;font-family:"Manrope",Arial,sans-serif}
        .path-not-found::before,.path-not-found::after{position:absolute;border:1px solid rgba(124,58,237,.12);border-radius:50%;content:"";pointer-events:none}.path-not-found::before{width:760px;height:760px;top:-540px;right:-205px}.path-not-found::after{width:570px;height:570px;bottom:-430px;left:-250px}
        .path-not-found-main{position:relative;z-index:1;display:grid;flex:1;grid-template-columns:minmax(0,1.08fr) minmax(420px,.92fr);align-items:center;gap:clamp(35px,7vw,120px);width:min(100%,1440px);margin:0 auto;padding:clamp(48px,8vw,110px) clamp(24px,7vw,110px)}
        .path-not-found-left{position:relative}.path-not-found-index{display:flex;align-items:center;gap:9px;color:#8f79a2;font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.path-not-found-index::before{width:8px;height:8px;border-radius:50%;background:#7c3aed;content:""}.path-not-found-code{margin:23px 0 0;color:#7c3aed;font:800 clamp(142px,19vw,285px)/.74 Manrope,sans-serif;letter-spacing:-.12em;text-shadow:0 15px 32px rgba(124,58,237,.13)}.path-not-found-left h1{max-width:590px;margin:36px 0 0;color:#33293c;font:800 clamp(34px,4.6vw,65px)/.99 Manrope,sans-serif;letter-spacing:-.07em}.path-not-found-left h1 em{color:#7c3aed;font-family:Georgia,"Times New Roman",serif;font-weight:500}.path-not-found-left>p{max-width:470px;margin:19px 0 0;color:#82768a;font-size:13px;line-height:1.75}
        .path-not-found-panel{position:relative;overflow:hidden;padding:34px;border:1px solid #dfd4ed;border-radius:22px;background:rgba(255,255,255,.84);box-shadow:0 25px 60px rgba(62,36,100,.11)}.path-not-found-panel::before{position:absolute;width:280px;height:280px;right:-175px;top:-140px;border:1px solid rgba(124,58,237,.14);border-radius:50%;content:""}.path-not-found-panel-header{position:relative;display:flex;align-items:center;justify-content:space-between;gap:15px}.path-not-found-panel-header span{color:#8f79a2;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.path-not-found-panel-header strong{display:inline-flex;align-items:center;gap:6px;color:#299267;font-size:9px}.path-not-found-panel-header strong i{width:6px;height:6px;border-radius:50%;background:#42bd8a}.path-not-found-panel h2{position:relative;max-width:340px;margin:55px 0 10px;color:#493358;font:800 27px/1.08 Manrope,sans-serif;letter-spacing:-.05em}.path-not-found-panel>p{position:relative;max-width:330px;margin:0;color:#82768a;font-size:11px;line-height:1.65}.path-not-found-actions{position:relative;display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.path-not-found-actions button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:43px;padding:0 15px;border-radius:9px;font:800 10px "DM Sans",Arial,sans-serif;cursor:pointer}.path-not-found-primary{border:1px solid #7134d6;background:#7c3aed;color:#fff;box-shadow:0 9px 17px rgba(124,58,237,.2)}.path-not-found-secondary{border:1px solid #e3dcec;background:#fff;color:#74657f}.path-not-found-actions button:active{transform:scale(.97)}.path-not-found-divider{height:1px;margin:27px 0 20px;background:#eee8f4}.path-not-found-tip{display:flex;align-items:flex-start;gap:9px;color:#a095a8;font-size:9px;line-height:1.55}.path-not-found-tip svg{flex:0 0 auto;margin-top:1px;color:#a48bcf}
        @media(max-width:800px){.path-not-found-main{display:flex;flex-direction:column;align-items:stretch;gap:37px;padding:53px 20px 55px}.path-not-found-code{margin-top:21px;font-size:140px}.path-not-found-left h1{margin-top:28px;font-size:39px}.path-not-found-left>p{font-size:12px}.path-not-found-panel{padding:25px}.path-not-found-panel h2{margin-top:39px;font-size:24px}.path-not-found-actions{flex-direction:column}.path-not-found-actions button{width:100%}}
      `}</style>
      <PathTopBar />
      <section className="path-not-found-main">
        <div className="path-not-found-left">
          <span className="path-not-found-index">System notice · record not found</span>
          <div className="path-not-found-code">404</div>
          <h1>The page took an <em>unexpected turn.</em></h1>
          <p>The address you followed is not part of the current workspace map. Your documents, assignments, and review records remain safe and accounted for.</p>
        </div>
        <aside className="path-not-found-panel">
          <div className="path-not-found-panel-header">
            <span>Next best step</span>
            <strong><i /> Workspace available</strong>
          </div>
          <h2>Let's get you back to the work that matters.</h2>
          <p>The page may have moved or the link may be outdated. Start from the overview or contact the Help Desk if you need a hand finding a record.</p>
          <div className="path-not-found-actions">
            <button className="path-not-found-primary" type="button" onClick={handleHome}>
              <Home size={15} /> Return to overview <ArrowRight size={14} />
            </button>
            <button className="path-not-found-secondary" type="button" onClick={handleHelpDesk}>
              <Search size={14} /> Visit Help Desk
            </button>
          </div>
          <div className="path-not-found-divider" />
          <div className="path-not-found-tip">
            <FileQuestion size={14} />
            <span>If you followed a saved link, open the record again from the current navigation to make sure you have the latest address.</span>
          </div>
        </aside>
      </section>
      <PathFooter />
    </main>
  );
}
