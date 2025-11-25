import React, { useState, useEffect } from 'react'
import { getClubData, getClubOptions, DEFAULT_CLUB_ID } from './golfClubsData'

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

const MIN_HANDICAP = -10
const MAX_HANDICAP = 54
const GOLFERS_STORAGE_KEY = 'golf_saved_golfers'
const CLUB_SELECTION_KEY = 'golf_selected_club'

export default function App() {
    // Load selected club from localStorage or use default
    const [selectedClubId, setSelectedClubId] = useState(() => {
        try {
            return localStorage.getItem(CLUB_SELECTION_KEY) || DEFAULT_CLUB_ID
        } catch (e) {
            return DEFAULT_CLUB_ID
        }
    })

    // Get current club data
    const clubData = getClubData(selectedClubId)
    const teeData = clubData.tees
    const defaultTee = Object.keys(teeData)[0]

    const [format, setFormat] = useState('fourball')
    const [holes, setHoles] = useState('18')
    const [players, setPlayers] = useState([
        { name: '', sex: 'men', hi: '', tee: defaultTee },
        { name: '', sex: 'men', hi: '', tee: defaultTee },
        { name: '', sex: 'men', hi: '', tee: defaultTee },
        { name: '', sex: 'men', hi: '', tee: defaultTee }
    ])
    const [result, setResult] = useState('')
    const [error, setError] = useState('')
    const [savedGolfers, setSavedGolfers] = useState([])
    const [newGolferName, setNewGolferName] = useState('')
    const [showGolferManager, setShowGolferManager] = useState(false)

    // Load saved golfers on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(GOLFERS_STORAGE_KEY)
            if (saved) {
                setSavedGolfers(JSON.parse(saved))
            }
        } catch (e) {
            console.error('Failed to load saved golfers:', e)
        }
    }, [])

    // Update localStorage when club selection changes
    useEffect(() => {
        try {
            localStorage.setItem(CLUB_SELECTION_KEY, selectedClubId)
            // Update document title
            document.title = `${clubData.name} - Handicap Calculator`
        } catch (e) {
            console.error('Failed to save club selection:', e)
        }
    }, [selectedClubId, clubData.name])

    // Handle club change
    function handleClubChange(newClubId) {
        const newClubData = getClubData(newClubId)
        const newDefaultTee = Object.keys(newClubData.tees)[0]

        // Reset players with new default tee, preserve names
        setPlayers(players.map(p => ({ ...p, tee: newDefaultTee })))
        setSelectedClubId(newClubId)
        setResult('')
        setError('')
    }

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
            const teeInfo = teeData[teeKey]
            if (!teeInfo) {
                throw new Error(`Tee "${teeKey}" not found`)
            }

            const data18 = teeInfo[sex]?.['18']
            if (!data18) {
                throw new Error(`Missing data for ${teeInfo.name} tee, ${sex}`)
            }

            if (holeKey !== '18') {
                const raw18 = index * (data18.slope / 113) + (data18.cr - data18.par)
                return raw18 * (9 / 18)
            }

            const data9 = teeInfo[sex]?.[holeKey]
            if (!data9) {
                throw new Error(`Missing data for ${teeInfo.name} tee, ${sex}, ${holeKey}`)
            }
            return index * (data9.slope / 113) + (data9.cr - data9.par)
        } catch (e) {
            throw new Error(`Course handicap calculation failed: ${e.message}`)
        }
    }

    // Format-specific calculation functions
    function calculateFourball(ch, activePlayers) {
        const ph = ch.map(x => Math.round(x * HANDICAP_ALLOWANCES.fourball))
        const low = Math.min(...ph)
        const shots = ph.map(x => x - low)

        const playerLines = activePlayers.map((p, i) => {
            const playerLabel = p.name || `Player ${i + 1}`
            return `${playerLabel}: ${shots[i]} shot${shots[i] !== 1 ? 's' : ''} (PH: ${ph[i]})`
        })

        return {
            lines: [
                `Playing Handicaps (90%): ${ph.join(' / ')}`,
                '',
                ...playerLines
            ],
            playingHandicaps: ph
        }
    }

    function calculateMatchplay(ch, activePlayers) {
        const low = Math.min(...ch)
        const shots = ch.map(x => x - low)

        const player1Label = activePlayers[0].name || 'Player 1'
        const player2Label = activePlayers[1].name || 'Player 2'

        return {
            lines: [
                `Playing Handicaps (100%): ${ch.join(' / ')}`,
                '',
                `${player1Label}: ${shots[0]} shot${shots[0] !== 1 ? 's' : ''} (PH: ${ch[0]})`,
                `${player2Label}: ${shots[1]} shot${shots[1] !== 1 ? 's' : ''} (PH: ${ch[1]})`
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

        const teamANames = [p[0].name || 'Player 1', p[1].name || 'Player 2'].filter(Boolean).join(' & ')
        const teamBNames = [p[2].name || 'Player 3', p[3].name || 'Player 4'].filter(Boolean).join(' & ')

        return {
            lines: [
                `Team A (${teamANames}): ${A}`,
                `Team B (${teamBNames}): ${B}`,
                '',
                `Team A: ${A - low} shot${A - low !== 1 ? 's' : ''}`,
                `Team B: ${B - low} shot${B - low !== 1 ? 's' : ''}`
            ],
            teamHandicaps: { A, B }
        }
    }

    function calculateGreensomes(ch, activePlayers) {
        const A = Math.round(ch[0] * HANDICAP_ALLOWANCES.greensomes_low + ch[1] * HANDICAP_ALLOWANCES.greensomes_high)
        const B = Math.round(ch[2] * HANDICAP_ALLOWANCES.greensomes_low + ch[3] * HANDICAP_ALLOWANCES.greensomes_high)
        const low = Math.min(A, B)

        const teamANames = [activePlayers[0].name || 'Player 1', activePlayers[1].name || 'Player 2'].filter(Boolean).join(' & ')
        const teamBNames = [activePlayers[2].name || 'Player 3', activePlayers[3].name || 'Player 4'].filter(Boolean).join(' & ')

        return {
            lines: [
                `Team A (${teamANames}): ${A} (60%/40%)`,
                `Team B (${teamBNames}): ${B} (60%/40%)`,
                '',
                `Team A: ${A - low} shot${A - low !== 1 ? 's' : ''}`,
                `Team B: ${B - low} shot${B - low !== 1 ? 's' : ''}`
            ],
            teamHandicaps: { A, B }
        }
    }

    function calculateBestBall(ch, format, activePlayers) {
        const factor = HANDICAP_ALLOWANCES[format] || 1
        const ph = ch.map(x => Math.round(x * factor))

        const playerLines = activePlayers.map((p, i) => {
            const playerLabel = p.name || `Player ${i + 1}`
            return `${playerLabel}: PH ${ph[i]}`
        })

        return {
            lines: [
                `Playing Handicaps (${Math.round(factor * 100)}%): ${ph.join(' / ')}`,
                '',
                ...playerLines
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
                formatResult = calculateFourball(ch, active)
            } else if (format === 'matchplay') {
                formatResult = calculateMatchplay(ch, active)
            } else if (['foursomes', 'pyms'].includes(format)) {
                formatResult = calculateFoursomesOrPyms(active, format)
            } else if (format === 'greensomes') {
                formatResult = calculateGreensomes(ch, active)
            } else if (isBestBall) {
                formatResult = calculateBestBall(ch, format, active)
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

    function handleSaveGolfer(playerIndex) {
        const player = players[playerIndex]
        if (!player.hi) {
            setError('Please enter a handicap before saving')
            return
        }
        if (!newGolferName.trim()) {
            setError('Please enter a golfer name')
            return
        }

        const golfer = {
            name: newGolferName.trim(),
            sex: player.sex,
            hi: player.hi,
            tee: player.tee,
            timestamp: new Date().toISOString()
        }

        const updated = [...savedGolfers, golfer]
        setSavedGolfers(updated)
        localStorage.setItem(GOLFERS_STORAGE_KEY, JSON.stringify(updated))
        setNewGolferName('')
        setError('')
        setShowGolferManager(false)
    }

    function handleLoadGolfer(golfer, playerIndex) {
        const copy = [...players]
        copy[playerIndex] = {
            name: golfer.name,
            sex: golfer.sex,
            hi: golfer.hi,
            tee: golfer.tee
        }
        setPlayers(copy)
        setError('')
    }

    function handleDeleteGolfer(index) {
        const updated = savedGolfers.filter((_, i) => i !== index)
        setSavedGolfers(updated)
        localStorage.setItem(GOLFERS_STORAGE_KEY, JSON.stringify(updated))
    }

    function handleUpdateGolfer(index) {
        const golfer = savedGolfers[index]
        const playerIndex = players.findIndex(p => p.hi === golfer.hi && p.sex === golfer.sex)

        if (playerIndex === -1) {
            setError('This golfer is not currently in the player list')
            return
        }

        const updatedGolfer = {
            ...golfer,
            sex: players[playerIndex].sex,
            hi: players[playerIndex].hi,
            tee: players[playerIndex].tee,
            timestamp: new Date().toISOString()
        }

        const updated = [...savedGolfers]
        updated[index] = updatedGolfer
        setSavedGolfers(updated)
        localStorage.setItem(GOLFERS_STORAGE_KEY, JSON.stringify(updated))
        setError('')
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

    const clubOptions = getClubOptions()

    return (
        <div className="container">
            <div className="header">
                <img src={`${import.meta.env.BASE_URL}${clubData.logo}`} alt={`${clubData.name} Logo`} className="logo" />
                <div className="title-wrapper">
                    <h1>{clubData.name} Handicap Calculator</h1>
                </div>
            </div>

            <div className="form-section">
                <label htmlFor="club-select">Golf Club:</label>
                <select
                    id="club-select"
                    value={selectedClubId}
                    onChange={e => handleClubChange(e.target.value)}
                    aria-label="Select golf club"
                >
                    {clubOptions.map(club => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                    ))}
                </select>

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
                        <div key={i}>
                            <div
                                className={`player-row ${isTeamFormat ? (i < 2 ? 'team-a-border' : 'team-b-border') : ''}`}
                                role="group"
                                aria-label={`Player ${i + 1} details`}
                            >
                                <label htmlFor={`player-${i}-name`}>Player {i + 1}:</label>
                                <input
                                    id={`player-${i}-name`}
                                    type="text"
                                    value={p.name}
                                    placeholder="Name"
                                    onChange={e => handlePlayerChange(i, 'name', e.target.value)}
                                    aria-label={`Player ${i + 1} name`}
                                />
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
                                    style={{ borderLeft: `4px solid ${teeData[p.tee]?.color || '#000'}` }}
                                    aria-label={`Player ${i + 1} tee selection`}
                                >
                                    {Object.entries(teeData).map(([teeKey, teeInfo]) => (
                                        <option key={teeKey} value={teeKey}>{teeInfo.name}</option>
                                    ))}
                                </select>
                            </div>
                            {savedGolfers.length > 0 && (
                                <div className="golfer-quick-load">
                                    <select
                                        value=""
                                        onChange={e => {
                                            const golfer = savedGolfers.find(g => g.name === e.target.value)
                                            if (golfer) handleLoadGolfer(golfer, i)
                                        }}
                                        aria-label={`Load saved golfer for Player ${i + 1}`}
                                    >
                                        <option value="">Load saved golfer...</option>
                                        {savedGolfers.map((golfer, idx) => (
                                            <option key={idx} value={golfer.name}>
                                                {golfer.name} ({golfer.sex === 'men' ? 'M' : 'L'}, HI: {golfer.hi})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
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
                <h3>Manage Golfers</h3>
                <button
                    onClick={() => setShowGolferManager(!showGolferManager)}
                    className="btn-secondary"
                    style={{ marginTop: '1rem', width: '100%' }}
                >
                    {showGolferManager ? 'Hide' : 'Show'} Golfer Manager
                </button>

                {showGolferManager && (
                    <div className="golfer-manager">
                        <h4>Save Current Player as Golfer:</h4>
                        <div className="save-golfer-section">
                            <select
                                onChange={e => {
                                    // Store selected player index for saving
                                    const idx = parseInt(e.target.value)
                                    if (!isNaN(idx)) {
                                        setError('')
                                    }
                                }}
                                aria-label="Select player to save"
                            >
                                <option value="">Select player to save...</option>
                                {players.slice(0, maxPlayers).map((p, i) => (
                                    <option key={i} value={i}>
                                        Player {i + 1} ({p.sex === 'men' ? 'M' : 'L'}, HI: {p.hi || 'not set'})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={newGolferName}
                                onChange={e => setNewGolferName(e.target.value)}
                                placeholder="Golfer name (e.g., John Smith)"
                                aria-label="Golfer name"
                            />
                            <button
                                onClick={() => {
                                    const select = document.querySelector('.save-golfer-section select')
                                    const idx = parseInt(select.value)
                                    if (!isNaN(idx)) {
                                        handleSaveGolfer(idx)
                                        select.value = ''
                                    } else {
                                        setError('Please select a player to save')
                                    }
                                }}
                                className="btn-secondary"
                            >
                                Save Golfer
                            </button>
                        </div>

                        {savedGolfers.length > 0 && (
                            <div className="saved-golfers">
                                <h4>Saved Golfers:</h4>
                                {savedGolfers.map((golfer, i) => (
                                    <div key={i} className="saved-config-item">
                                        <span className="config-name">{golfer.name}</span>
                                        <span className="config-details">
                                            {golfer.sex === 'men' ? 'Men' : 'Ladies'} • HI: {golfer.hi} • {teeData[golfer.tee]?.name || golfer.tee}
                                        </span>
                                        <button onClick={() => handleDeleteGolfer(i)} className="btn-small btn-danger">Delete</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
