import { useState } from 'react'
import { layoutLabel } from '../display/applyProfile'
import { OVERRIDE_OPTIONS } from '../display/types'
import { useDisplay } from '../os/DisplayContext'

export function SettingsModule() {
  const { snapshot, setOverride, setCalibration, rememberDisplay, copyReport } = useDisplay()
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'display' | 'diagnostics'>('display')

  if (!snapshot) {
    return (
      <div className="mod">
        <p>Reading display…</p>
      </div>
    )
  }

  const { detectedProfile, detectedConfidence, applied, overrideMode, runtime } = snapshot
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

          <button type="button" onClick={() => rememberDisplay()}>
            Remember this display
          </button>
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
            className="primary"
            onClick={async () => {
              await copyReport()
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1600)
            }}
          >
            {copied ? 'Copied' : 'Copy Display Report'}
          </button>
        </div>
      )}
    </div>
  )
}
