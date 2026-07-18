const { SceneStage } = window;
const { useTweaks, TweaksPanel, TweakSection, TweakToggle } = window;

function AppRoot() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);

  return (
    <div style={{ position: 'relative', width: 1080, height: 1080 }}>
      <SceneStage width={1080} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#ffffff">
        {{ Splash: window.Splash }}
      </SceneStage>
      <TweaksPanel>
        <TweakSection label="Playback" />
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
      </TweaksPanel>
    </div>
  );
}

window.AppRoot = AppRoot;
