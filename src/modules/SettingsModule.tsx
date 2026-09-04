import { useState } from 'react'
import { layoutLabel } from '../display/applyProfile'
import { describeRememberedDisplay } from '../display/rememberedDisplay'
import { formatDisplayReport } from '../display/report'
import { OVERRIDE_OPTIONS } from '../display/types'
import { useDisplay } from '../os/DisplayContext'

export function SettingsModule() {
  const {
    snapshot,
    setOverride,
    setCalibration,
    rememberDisplay,
    updateRememberedDisplay,
    forgetRememberedDisplay,
    resetDisplayMemory,
    copyReport,
  } = useDisplay()
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'display' | 'diagnostics'>('display')

  if (!snapshot) {
    return (
      <div className="mod">
        <p>Reading display…</p>
      </div>
    )
  }

  const report = formatDisplayReport(snapshot)

  const { detectedProfile, detectedConfidence, applied, overrideMode, runtime } = snapshot
  const currentFingerprint = runtime.hardwareFingerprint
  const currentDetectedProfile = detectedProfile
  const currentActiveProfile = snapshot.activeProfile
  const currentlyRememberedProfileForFingerprint = snapshot.identity.fingerprintProfileId ?? null
  const remembered = describeRememberedDisplay({
    currentFingerprint,
    currentDetectedProfile,
    currentActiveProfile,
    currentlyRememberedProfileForFingerprint,
    overrideMode,
  })
  const calibration = snapshot.applied
  const profileId = applied.profile.id

  return (
    <div className="mod settings">
      <header className="settings-head">
        <h1>Settings</h1>
        <div className="segment">
          <button type="button" className={tab === 'display' ? 'is-on' : ''} onClick={() => setTab('display')}>
            Display
          </button>
          <button type="button" className={tab === 'diagnostics' ? 'is-on' : ''} onClick={() => setTab('diagnostics')}>
            Diagnostics
          </button>
        </div>
      </header>

      {tab === 'display' ? (
        <div className="settings-panel">
          <dl className="spec-list">
            <div>
              <dt>Detected Display</dt>
              <dd>{detectedProfile.label}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{Math.round(detectedConfidence)}%</dd>
            </div>
            <div>
              <dt>Active Layout</dt>
              <dd>{layoutLabel(applied.resolvedLayout)}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{overrideMode.replaceAll('_', ' ')}</dd>
            </div>
          </dl>

          <fieldset>
            <legend>Profile override</legend>
            <div className="override-grid">
              {OVERRIDE_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  className={overrideMode === option.mode ? 'is-on' : ''}
                  onClick={() => setOverride(option.mode)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="fine">AUTO is default. Manual override is stored on this display only.</p>
          </fieldset>

          <fieldset>
            <legend>Calibration · {applied.profile.label}</legend>
            <label>
              Scale {calibration.uiScale.toFixed(2)}
              <input
                type="range"
                min={0.8}
                max={1.25}
                step={0.01}
                value={calibration.uiScale}
                onChange={(event) => setCalibration(profileId, { scale: Number(event.target.value) })}
              />
            </label>
            <label>
              Touch target {calibration.touchTarget}px
              <input
                type="range"
                min={40}
                max={72}
                step={1}
                value={calibration.touchTarget}
                onChange={(event) => setCalibration(profileId, { touchTarget: Number(event.target.value) })}
              />
            </label>
            <label>
              Safe top {calibration.safeArea.top}px
              <input
                type="range"
                min={8}
                max={64}
                step={1}
                value={calibration.safeArea.top}
                onChange={(event) =>
                  setCalibration(profileId, { safeArea: { top: Number(event.target.value) } })
                }
              />
            </label>
            <p className="fine">Calibration is saved per profile. RAM HDMI and Ford do not share values.</p>
          </fieldset>

          <fieldset>
            <legend>Remembered display</legend>
            <p className="remember-as">{remembered.headline}</p>
            {remembered.forcedWarning ? <p className="fine">{remembered.forcedWarning}</p> : null}
            {remembered.differsFromActive ? <p className="fine">Stored profile differs from current profile.</p> : null}
            <p className="fine">Fingerprint: {currentFingerprint}</p>
            <div className="remember-actions">
              {remembered.status === 'unmapped' ? (
                <button type="button" className="primary" onClick={() => rememberDisplay()}>
                  Remember this display
                </button>
              ) : null}
              {remembered.differsFromActive ? (
                <button type="button" className="primary" onClick={() => updateRememberedDisplay()}>
                  Update remembered profile to {remembered.rememberTargetLabel}
                </button>
              ) : null}
              {currentlyRememberedProfileForFingerprint ? (
                <button type="button" onClick={() => forgetRememberedDisplay()}>
                  Forget remembered display
                </button>
              ) : null}
            </div>
            <button type="button" onClick={() => resetDisplayMemory({ resetOverride: true })}>
              Reset Display Memory
            </button>
            <p className="fine">
              Reset clears fingerprint mappings and the display override. Per-profile calibration is kept.
            </p>
          </fieldset>
        </div>
      ) : (
        <div className="settings-panel diagnostics">
          <h2>Display Diagnostics</h2>
          <dl className="spec-list">
            <div>
              <dt>Detected profile</dt>
              <dd>{detectedProfile.id}</dd>
            </div>
            <div>
              <dt>Confidence score</dt>
              <dd>{Math.round(detectedConfidence)}%</dd>
            </div>
            <div>
              <dt>innerWidth × innerHeight</dt>
              <dd>
                {runtime.innerWidth} × {runtime.innerHeight}
              </dd>
            </div>
            <div>
              <dt>screen.width × screen.height</dt>
              <dd>
                {runtime.screenWidth} × {runtime.screenHeight}
              </dd>
            </div>
            <div>
              <dt>devicePixelRatio</dt>
              <dd>{runtime.devicePixelRatio}</dd>
            </div>
            <div>
              <dt>aspect ratio</dt>
              <dd>{runtime.aspectRatio.toFixed(4)}</dd>
            </div>
            <div>
              <dt>orientation</dt>
              <dd>{runtime.orientationType ?? runtime.orientation}</dd>
            </div>
            <div>
              <dt>fullscreen status</dt>
              <dd>{runtime.fullscreen ? 'yes' : 'no'}</dd>
            </div>
          </dl>
          <button
            type="button"
            className={`primary ${copied ? 'is-on' : ''}`}
            aria-live="polite"
            onPointerUp={() => {
              setCopied(true)
              void copyReport()
            }}
            onClick={() => {
              setCopied(true)
              void copyReport()
            }}
          >
            {copied ? 'Copied' : 'Copy Display Report'}
          </button>
          {copied ? <p className="copy-status">Display report copied. You can also select the text below.</p> : null}
          <pre className="display-report" aria-label="Display report">
            {report}
          </pre>
        </div>
      )}
    </div>
  )
}
