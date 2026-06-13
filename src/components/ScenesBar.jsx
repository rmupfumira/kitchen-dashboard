import * as L from "lucide-react";
import { Sparkles } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

function toPascal(name) {
  return String(name)
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function SceneBtn({ scene, onActivate }) {
  const ent = useEntity(scene.entity);
  const domain = scene.entity.split(".")[0];
  const Icon = L[toPascal(scene.icon)] || Sparkles;
  const on = domain === "input_boolean" && ent?.state === "on";

  return (
    <button type="button" className={"scene-btn" + (on ? " on" : "")} onClick={() => onActivate(scene)}>
      <span className="scene-ic">
        <Icon size={18} strokeWidth={2} />
      </span>
      {scene.name}
    </button>
  );
}

/** Footer scene bar — Good Morning · Night · Guest · Movie. */
export default function ScenesBar({ onToast }) {
  const call = useService();

  const activate = (scene) => {
    const domain = scene.entity.split(".")[0];
    onToast?.("sparkles", `${scene.name} activated`);
    if (domain === "scene") call("scene", "turn_on", {}, { entity_id: scene.entity });
    else if (domain === "input_boolean") call("input_boolean", "toggle", {}, { entity_id: scene.entity });
    else if (domain === "script") call("script", "turn_on", {}, { entity_id: scene.entity });
    else call(domain, "turn_on", {}, { entity_id: scene.entity });
  };

  return (
    <div className="scenes-bar rise">
      {ENTITIES.scenes.map((s) => (
        <SceneBtn key={s.id} scene={s} onActivate={activate} />
      ))}
    </div>
  );
}
