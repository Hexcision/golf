import React, { useState, useEffect } from 'react'

const teeData = {
    navy: { men: { '18': { slope: 125, cr: 71.3, par: 70 }, '9f': { slope: 126, cr: 35.6, par: 35 }, '9b': { slope: 125, cr: 35.6, par: 35 } }, ladies: { '18': { slope: 137, cr: 77.0, par: 72 }, '9f': { slope: 136, cr: 38.4, par: 36 }, '9b': { slope: 139, cr: 38.6, par: 36 } } },
    silver: { men: { '18': { slope: 121, cr: 69.9, par: 70 }, '9f': { slope: 119, cr: 34.7, par: 35 }, '9b': { slope: 123, cr: 35.2, par: 35 } }, ladies: { '18': { slope: 142, cr: 75.3, par: 72 }, '9f': { slope: 137, cr: 37.6, par: 36 }, '9b': { slope: 146, cr: 37.7, par: 36 } } },
    heather: { men: { '18': { slope: 127, cr: 72.2, par: 72 }, '9f': { slope: 124, cr: 34.0, par: 36 }, '9b': { slope: 116, cr: 34.4, par: 36 } }, ladies: { '18': { slope: 130, cr: 73.9, par: 72 }, '9f': { slope: 129, cr: 37.1, par: 36 }, '9b': { slope: 131, cr: 36.8, par: 36 } } }
}

// Constants for handicap allowances
const HANDICAP_ALLOWANCES = {
    fourball: 0.90,
    matchplay: 1.00,
    foursomes: 0.50,
    greensomes_low: 0.60,
    greensomes_high: 0.40,
    pyms: 0.50,
    best_1_from_4: 0.75,
    best_2_from_4: 0.85,
    best_3_from_4: 1.00,
    best_1_from_3: 0.70,
    best_2_from_3: 0.85,
    best_3_from_3: 1.00
}

const MIN_HANDICAP = 0
const MAX_HANDICAP = 54
const STORAGE_KEY = 'hindhead_golf_saved_configs'

// Tee color mapping
const TEE_COLORS = {
    navy: '#000080',
    silver: '#C0C0C0',
    heather: '#967BB6'
}

export default function App() {
    const [format, setFormat] = useState('fourball')
    const [holes, setHoles] = useState('18')
    const [players, setPlayers] = useState([
        { sex: 'men', hi: '', tee: 'navy' },
        { sex: 'men', hi: '', tee: 'navy' },
        { sex: 'men', hi: '', tee: 'navy' },
        { sex: 'men', hi: '', tee: 'navy' }
    ])
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [savedConfigs, setSavedConfigs] = useState([])
    const [configName, setConfigName] = useState('')

    // Load saved configurations on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                setSavedConfigs(JSON.parse(saved))
            }
        } catch (e) {
            console.error('Failed to load saved configurations:', e)
        }
    }, [])

    const isSingles = format === 'matchplay'
    const isBestBall = format.startsWith('best_')
    let bestN = 0, bestTotal = 0
    if (isBestBall) {
        const parts = format.split('_')
        bestN = parseInt(parts[1], 10)
        bestTotal = parseInt(parts[3], 10)
    }
    const maxPlayers = isSingles ? 2 : isBestBall ? bestTotal : 4
    const isTeamFormat = ['foursomes', 'pyms', 'greensomes'].includes(format)

    function handlePlayerChange(idx, field, value) {
        const copy = [...players]
        copy[idx][field] = value
        setPlayers(copy)
        setError('') // Clear error on input change
    }

    function validateHandicap(hi) {
        const num = parseFloat(hi)
        if (isNaN(num)) return { valid: false, message: 'Invalid handicap value' }
        if (num < MIN_HANDICAP || num > MAX_HANDICAP) {
            return { valid: false, message: `Handicap must be between ${MIN_HANDICAP} and ${MAX_HANDICAP}` }
        }
        return { valid: true }
    }

    function calculateCourseHandicap(index, sex, teeKey, holeKey) {
        try {
            const data18 = teeData[teeKey]?.[sex]?.['18']
            if (!data18) {
                throw new Error(`Missing data for ${teeKey} tee, ${sex}`)
            }

            if (holeKey !== '18') {
                const raw18 = index * (data18.slope / 113) + (data18.cr - data18.par)
                return raw18 * (9 / 18)
            }

            const data9 = teeData[teeKey]?.[sex]?.[holeKey]
            if (!data9) {
                throw new Error(`Missing data for ${teeKey} tee, ${sex}, ${holeKey}`)
            }
            return index * (data9.slope / 113) + (data9.cr - data9.par)
        } catch (e) {
            throw new Error(`Course handicap calculation failed: ${e.message}`)
        }
    }

    // Format-specific calculation functions
    function calculateFourball(ch) {
        const ph = ch.map(x => Math.round(x * HANDICAP_ALLOWANCES.fourball))
        const low = Math.min(...ph)
        const shots = ph.map(x => x - low)
        return {
            lines: [
                `Playing Handicaps (90%): ${ph.join(' / ')}`,
                `Strokes vs lowest: ${shots.join(' / ')}`
            ],
            playingHandicaps: ph
        }
    }

    function calculateMatchplay(ch) {
        const low = Math.min(...ch)
        const shots = ch.map(x => x - low)
        return {
            lines: [
                `Playing Handicaps (100%): ${ch.join(' / ')}`,
                `Strokes vs lowest: ${shots.join(' / ')}`
            ],
            playingHandicaps: ch
        }
    }

    function calculateFoursomesOrPyms(active, format) {
        // Create copies to avoid mutation
        const p = active.map(player => ({ ...player, hi: parseFloat(player.hi) }))

        if (format === 'pyms') {
            const sumA = p[0].hi + p[1].hi
            const sumB = p[2].hi + p[3].hi
            const capA = sumA > 40 ? 40 / sumA : 1
            const capB = sumB > 40 ? 40 / sumB : 1
            p[0].hi *= capA
            p[1].hi *= capA
            p[2].hi *= capB
            p[3].hi *= capB
        }

        const A = Math.round((calculateCourseHandicap(p[0].hi, p[0].sex, p[0].tee, holes) +
                              calculateCourseHandicap(p[1].hi, p[1].sex, p[1].tee, holes)) * HANDICAP_ALLOWANCES.foursomes)
        const B = Math.round((calculateCourseHandicap(p[2].hi, p[2].sex, p[2].tee, holes) +
                              calculateCourseHandicap(p[3].hi, p[3].sex, p[3].tee, holes)) * HANDICAP_ALLOWANCES.foursomes)
        const low = Math.min(A, B)

        return {
            lines: [
                `Team A (Players 1 & 2): ${A}`,
                `Team B (Players 3 & 4): ${B}`,
                `Strokes vs lowest: Team A ${A - low}, Team B ${B - low}`
            ],
            teamHandicaps: { A, B }
        }
    }

    function calculateGreensomes(ch) {
        const A = Math.round(ch[0] * HANDICAP_ALLOWANCES.greensomes_low + ch[1] * HANDICAP_ALLOWANCES.greensomes_high)
        const B = Math.round(ch[2] * HANDICAP_ALLOWANCES.greensomes_low + ch[3] * HANDICAP_ALLOWANCES.greensomes_high)
        const low = Math.min(A, B)

        return {
            lines: [
                `Team A (Players 1 & 2): ${A} (60%/40%)`,
                `Team B (Players 3 & 4): ${B} (60%/40%)`,
                `Strokes vs lowest: Team A ${A - low}, Team B ${B - low}`
            ],
            teamHandicaps: { A, B }
        }
    }

    function calculateBestBall(ch, format) {
        const factor = HANDICAP_ALLOWANCES[format] || 1
        const ph = ch.map(x => Math.round(x * factor))
        return {
            lines: [
                `Playing Handicaps (${Math.round(factor * 100)}%): ${ph.join(' / ')}`
            ],
            playingHandicaps: ph
        }
    }

    function handleCalculate() {
        try {
            setError('')
            const active = players.slice(0, maxPlayers)

            // Validate all handicaps
            for (let i = 0; i < active.length; i++) {
                if (active[i].hi === '') {
                    setError(`Please enter handicap for Player ${i + 1}`)
                    setResult('')
                    return
                }
                const validation = validateHandicap(active[i].hi)
                if (!validation.valid) {
                    setError(`Player ${i + 1}: ${validation.message}`)
                    setResult('')
                    return
                }
            }

            const ch = active.map(p => Math.round(calculateCourseHandicap(+p.hi, p.sex, p.tee, holes)))

            let holeLabel = holes === '18' ? '18 Holes' : holes === '9f' ? '9 Holes (Front)' : '9 Holes (Back)'
            let out = []
            out.push(`Course Handicaps (${holeLabel}): ${ch.join(' / ')}`)

            let formatResult
            if (format === 'fourball') {
                formatResult = calculateFourball(ch)
            } else if (format === 'matchplay') {
                formatResult = calculateMatchplay(ch)
            } else if (['foursomes', 'pyms'].includes(format)) {
                formatResult = calculateFoursomesOrPyms(active, format)
            } else if (format === 'greensomes') {
                formatResult = calculateGreensomes(ch)
            } else if (isBestBall) {
                formatResult = calculateBestBall(ch, format)
            }

            if (formatResult) {
                out.push(...formatResult.lines)
            }

            setResult(out.join('\n'))
        } catch (e) {
            setError(e.message)
            setResult('')
        }
    }

    function handleSaveConfig() {
        if (!configName.trim()) {
            setError('Please enter a configuration name')
            return
        }

        const config = {
            name: configName,
            format,
            holes,
            players: players.slice(0, maxPlayers),
            timestamp: new Date().toISOString()
        }

        const updated = [...savedConfigs, config]
        setSavedConfigs(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        setConfigName('')
        setError('')
    }

    function handleLoadConfig(config) {
        setFormat(config.format)
        setHoles(config.holes)
        setPlayers([...config.players, ...players.slice(config.players.length)])
        setError('')
    }

    function handleDeleteConfig(index) {
        const updated = savedConfigs.filter((_, i) => i !== index)
        setSavedConfigs(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }

    function handlePrint() {
        window.print()
    }

    function handleShare() {
        const shareText = `Hindhead Golf Handicap Calculator\n\n${result}`

        if (navigator.share) {
            navigator.share({
                title: 'Golf Handicap Calculation',
                text: shareText
            }).catch(err => console.log('Share failed:', err))
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Results copied to clipboard!')
            }).catch(() => {
                setError('Failed to copy to clipboard')
            })
        }
    }

    return (
        <div className="container">
            <div className="header">
                <img src="club-logo-nobg.png" alt="Hindhead Golf Club Logo" className="logo" />
                <div className="title-wrapper">
                    <h1>Hindhead Golf Handicap Calculator</h1>
                </div>
            </div>

            <div className="form-section">
                <label htmlFor="format-select">Match Format:</label>
                <select
                    id="format-select"
                    value={format}
                    onChange={e => setFormat(e.target.value)}
                    aria-label="Select match format"
                >
                    <option value="fourball">Fourball (90%)</option>
                    <option value="foursomes">Foursomes (50%) combined</option>
                    <option value="greensomes">Greensomes (60/40 split)</option>
                    <option value="pyms">Pyms (50%, Max Combined Index 40)</option>
                    <option value="matchplay">Singles Matchplay (100%)</option>
                    <option value="best_1_from_4">Best 1 from 4</option>
                    <option value="best_2_from_4">Best 2 from 4</option>
                    <option value="best_3_from_4">Best 3 from 4</option>
                    <option value="best_1_from_3">Best 1 from 3</option>
                    <option value="best_2_from_3">Best 2 from 3</option>
                    <option value="best_3_from_3">Best 3 from 3</option>
                </select>

                <label htmlFor="holes-select">Number of Holes:</label>
                <select
                    id="holes-select"
                    value={holes}
                    onChange={e => setHoles(e.target.value)}
                    aria-label="Select number of holes"
                >
                    <option value="18">18 Holes</option>
                    <option value="9f">9 Holes (Front)</option>
                    <option value="9b">9 Holes (Back)</option>
                </select>
            </div>

            <h2>Player Handicaps, Sex & Tee Selection</h2>

            {isTeamFormat && (
                <div className="team-labels">
                    <div className="team-label team-a">Team A</div>
                    <div className="team-label team-b">Team B</div>
                </div>
            )}

            <div className="players-grid">
                {players.map((p, i) => (
                    i < maxPlayers && (
                        <div
                            key={i}
                            className={`player-row ${isTeamFormat ? (i < 2 ? 'team-a-border' : 'team-b-border') : ''}`}
                            role="group"
                            aria-label={`Player ${i + 1} details`}
                        >
                            <label htmlFor={`player-${i}-sex`}>Player {i + 1}:</label>
                            <select
                                id={`player-${i}-sex`}
                                value={p.sex}
                                onChange={e => handlePlayerChange(i, 'sex', e.target.value)}
                                aria-label={`Player ${i + 1} sex`}
                            >
                                <option value="men">Men</option>
                                <option value="ladies">Ladies</option>
                            </select>
                            <input
                                id={`player-${i}-hi`}
                                type="number"
                                step="0.1"
                                min={MIN_HANDICAP}
                                max={MAX_HANDICAP}
                                value={p.hi}
                                placeholder="HI"
                                onChange={e => handlePlayerChange(i, 'hi', e.target.value)}
                                aria-label={`Player ${i + 1} handicap index`}
                                aria-describedby="handicap-hint"
                            />
                            <select
                                id={`player-${i}-tee`}
                                value={p.tee}
                                onChange={e => handlePlayerChange(i, 'tee', e.target.value)}
                                style={{ borderLeft: `4px solid ${TEE_COLORS[p.tee]}` }}
                                aria-label={`Player ${i + 1} tee selection`}
                            >
                                <option value="navy">Navy</option>
                                <option value="silver">Silver</option>
                                <option value="heather">Heather</option>
                            </select>
                        </div>
                    )
                ))}
            </div>
            <small id="handicap-hint" className="hint">Handicap must be between {MIN_HANDICAP} and {MAX_HANDICAP}</small>

            {error && <div className="error" role="alert" aria-live="assertive">{error}</div>}

            <div className="button-group">
                <button onClick={handleCalculate} className="btn-primary">Calculate Handicaps</button>
                {result && (
                    <>
                        <button onClick={handlePrint} className="btn-secondary" aria-label="Print results">Print</button>
                        <button onClick={handleShare} className="btn-secondary" aria-label="Share results">Share</button>
                    </>
                )}
            </div>

            {result && (
                <div className="result" role="region" aria-label="Calculation results" aria-live="polite">
                    {result}
                </div>
            )}

            <div className="save-load-section">
                <h3>Save/Load Configuration</h3>
                <div className="save-config">
                    <input
                        type="text"
                        value={configName}
                        onChange={e => setConfigName(e.target.value)}
                        placeholder="Configuration name"
                        aria-label="Configuration name"
                    />
                    <button onClick={handleSaveConfig} className="btn-secondary">Save Current Setup</button>
                </div>

                {savedConfigs.length > 0 && (
                    <div className="saved-configs">
                        <h4>Saved Configurations:</h4>
                        {savedConfigs.map((config, i) => (
                            <div key={i} className="saved-config-item">
                                <span className="config-name">{config.name}</span>
                                <span className="config-details">
                                    {config.format} • {config.holes === '18' ? '18 holes' : config.holes === '9f' ? '9F' : '9B'}
                                </span>
                                <button onClick={() => handleLoadConfig(config)} className="btn-small">Load</button>
                                <button onClick={() => handleDeleteConfig(i)} className="btn-small btn-danger">Delete</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
