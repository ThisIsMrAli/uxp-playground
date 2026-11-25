import { hostInfo, type HostApp } from '../../core/hosts';
import { parseManifest, primaryHost } from '../../core/manifest';
import { PREMIERE_SCENARIOS, type PreviewScenario } from '../../core/scenarios';
import { TEMPLATES, type Template } from '../../core/templates';
import { Dialog } from './Dialog';

interface NativeCheck {
  version: string;
  platform: string;
  result: string;
  screenshot?: string;
  alt?: string;
}

const nativeChecks: Record<string, NativeCheck> = {
  'premiere-marker-csv': {
    version: '26.5.2',
    platform: 'macOS',
    result: 'Previewed and saved a real sequence marker with commas, quotation marks, and a comment. Checked the saved CSV.',
    screenshot: 'host-checks/premiere-marker-csv.png',
    alt: 'Premiere Pro panel showing a saved CSV with one sequence marker and its review comment.'
  },
  'premiere-sequence': { version: '26.5.2', platform: 'macOS', result: 'Loaded in UXP Developer Tool and refreshed the project and sequence summary in Premiere Pro.' },
  hello: { version: '26.0', platform: 'macOS', result: 'Loaded in UXP Developer Tool and read the active document in Photoshop.' }
};

export function nativeCheck(templateId: string): NativeCheck | undefined {
  return Object.hasOwn(nativeChecks, templateId) ? nativeChecks[templateId] : undefined;
}

const guides = new Map(TEMPLATES.filter((t) => t.recipe || nativeCheck(t.id) || t.id === 'premiere-markers')
  .map((t) => [parseManifest(t.build().files['manifest.json']).value?.id, t]));

export function templateFromManifest(id: unknown): Template | undefined {
  return guides.get(id);
}

export function RecipeGuide({ template, scenario, host, onClose, onRun }: {
  template: Template;
  scenario: PreviewScenario;
  host: HostApp;
  onClose: () => void;
  onRun: () => void;
}) {
  const recipe = template.recipe;
  const check = nativeCheck(template.id);
  const manifest = parseManifest(template.build().files['manifest.json']).value;
  const target = primaryHost(manifest);
  const hostLabel = hostInfo(target.app)?.label ?? hostInfo(host)?.label;
  const fixture = target.app === 'premierepro' ? PREMIERE_SCENARIOS.find(({ id }) => id === scenario) : undefined;
  return (
    <Dialog title={template.label} onClose={onClose} wide testId="recipe-guide" footer={<button className="btn primary" onClick={onRun}>Run in host</button>}>
      {fixture && <section className="share-sec">
        <h3>Browser preview</h3>
        <p><strong>{fixture.label}.</strong> {fixture.description}</p>
        {recipe && <><p>{recipe.input}</p><p><strong>Expected result with the sample data.</strong> {recipe.expected}</p></>}
      </section>}
      <section className="share-sec">
        <h3>Try it in {hostLabel}</h3>
        <p>{template.label} targets {hostLabel} {target.minVersion} or later.</p>
        {recipe && <ol className="recipe-steps">{recipe.hostSteps.map((step) => <li key={step}>{step}</li>)}</ol>}
        <p className="muted small">{check ? `Original starter tested in ${hostLabel} ${check.version} on ${check.platform}. ${check.result}` : 'Native host verification is pending.'}</p>
        {check?.screenshot && <figure className="recipe-screenshot">
          <img src={import.meta.env.BASE_URL + check.screenshot} alt={check.alt} loading="lazy" />
          <figcaption>{hostLabel} {check.version} · {check.platform}</figcaption>
        </figure>}
        {recipe && <p className="recipe-docs">{recipe.docs.map(({ label, url }) => <a key={url} href={url} target="_blank" rel="noreferrer">{label}</a>)}</p>}
      </section>
    </Dialog>
  );
}
