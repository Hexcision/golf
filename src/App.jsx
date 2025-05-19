import React, { useState } from 'react'

const teeData = {
    navy: { men: { '18': { slope: 125, cr: 71.3, par: 70 }, '9f': { slope: 126, cr: 35.6, par: 35 }, '9b': { slope: 125, cr: 35.6, par: 35 } }, ladies: { '18': { slope: 137, cr: 77.0, par: 72 }, '9f': { slope: 136, cr: 38.4, par: 36 }, '9b': { slope: 139, cr: 38.6, par: 36 } } },
    silver: { men: { '18': { slope: 121, cr: 69.9, par: 70 }, '9f': { slope: 119, cr: 34.7, par: 35 }, '9b': { slope: 123, cr: 35.2, par: 35 } }, ladies: { '18': { slope: 142, cr: 75.3, par: 72 }, '9f': { slope: 137, cr: 37.6, par: 36 }, '9b': { slope: 146, cr: 37.7, par: 36 } } },
    heather: { men: { '18': { slope: 127, cr: 72.2, par: 72 }, '9f': { slope: 124, cr: 34.0, par: 36 }, '9b': { slope: 116, cr: 34.4, par: 36 } }, ladies: { '18': { slope: 130, cr: 73.9, par: 72 }, '9f': { slope: 129, cr: 37.1, par: 36 }, '9b': { slope: 131, cr: 36.8, par: 36 } } }
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

    const isSingles = format === 'matchplay'

    function handlePlayerChange(idx, field, value) {
        const copy = [...players]
        copy[idx][field] = value
        setPlayers(copy)
    }

    function calculateCourseHandicap(index, sex, teeKey, holeKey) {
        const data18 = teeData[teeKey]?.[sex]?.['18']
        if (!data18) return NaN
        if (holeKey !== '18') {
            const raw18 = index * (data18.slope / 113) + (data18.cr - data18.par)
            return raw18 * (9 / 18)
        }
        const data9 = teeData[teeKey]?.[sex]?.[holeKey]
        if (!data9) return NaN
        return index * (data9.slope / 113) + (data9.cr - data9.par)
    }

    function handleCalculate() {
        const active = players.slice(0, isSingles ? 2 : 4)
        if (active.some(p => p.hi === '' || isNaN(p.hi))) {
            setResult('Please enter all handicaps.')
            return
        }
        const ch = active.map(p => Math.round(calculateCourseHandicap(+p.hi, p.sex, p.tee, holes)))

        let holeLabel = holes === '18' ? '18 Holes' : holes === '9f' ? '9 Holes (Front)' : '9 Holes (Back)'
        let out = []
        out.push(`Course Handicaps (${holeLabel}): ${ch.join(' / ')}`)

        if (format === 'fourball') {
            const ph = ch.map(x => Math.round(x * 0.9))
            const low = Math.min(...ph)
            const shots = ph.map(x => x - low)
            out.push(`Playing HIs (90%): ${ph.join(' / ')}`)
            out.push(`Strokes vs lowest: ${shots.join(' / ')}`)

        } else if (format === 'matchplay') {
            const low = Math.min(...ch)
            const shots = ch.map(x => x - low)
            out.push(`Playing HIs (100%): ${ch.join(' / ')}`)
            out.push(`Strokes vs lowest: ${shots.join(' / ')}`)

        } else if (['foursomes', 'pyms'].includes(format)) {
            let p = [...active]
            if (format === 'pyms') {
                const sumA = p[0].hi + p[1].hi
                const sumB = p[2].hi + p[3].hi
                const capA = sumA > 40 ? 40 / sumA : 1
                const capB = sumB > 40 ? 40 / sumB : 1
                p[0].hi *= capA; p[1].hi *= capA; p[2].hi *= capB; p[3].hi *= capB
            }
            const A = Math.round((calculateCourseHandicap(p[0].hi, p[0].sex, p[0].tee, holes) + calculateCourseHandicap(p[1].hi, p[1].sex, p[1].tee, holes)) / 2)
            const B = Math.round((calculateCourseHandicap(p[2].hi, p[2].sex, p[2].tee, holes) + calculateCourseHandicap(p[3].hi, p[3].sex, p[3].tee, holes)) / 2)
            const low = Math.min(A, B)
            out.push(`Team A: ${A}, Team B: ${B}`)
            out.push(`Strokes vs lowest: A ${A - low}, B ${B - low}`)

        } else if (format === 'greensomes') {
            const A = Math.round(ch[0] * 0.6 + ch[1] * 0.4)
            const B = Math.round(ch[2] * 0.6 + ch[3] * 0.4)
            const low = Math.min(A, B)
            out.push(`Team A: ${A}, Team B: ${B}`)
            out.push(`Strokes vs lowest: A ${A - low}, B ${B - low}`)
        }

        setResult(out.join('\n'))
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', }}>
                <img src="club-logo-nobg.png" alt="Hindhead" className="logo" />
                <div style={{ display: 'flex', justifyContent: 'center', flexGrow: 1}}>
                <h2>Hindhead Golf Handicap Calculator</h2>
                </div>
            </div>

            <label>Match Format:</label>
            <select value={format} onChange={e => setFormat(e.target.value)}>
                <option value="fourball">Fourball (90%)</option>
                <option value="foursomes">Foursomes (50%) combined</option>
                <option value="greensomes">Greensomes (60/40 split)</option>
                <option value="pyms">Pyms (50%, Max Combined Index 40)</option>
                <option value="matchplay">Singles Matchplay (100%)</option>
            </select>

            <label>Number of Holes:</label>
            <select value={holes} onChange={e => setHoles(e.target.value)}>
                <option value="18">18 Holes</option>
                <option value="9f">9 Holes (Front)</option>
                <option value="9b">9 Holes (Back)</option>
            </select>

            <h3>Player Handicaps, Sex & Tee Selection</h3>
            {players.map((p, i) => (
                (i < 2 || !isSingles) && (
                    <div key={i} className="player-row">
                        <label>Player {i + 1}:</label>
                        <select value={p.sex} onChange={e => handlePlayerChange(i, 'sex', e.target.value)}>
                            <option value="men">Men</option>
                            <option value="ladies">Ladies</option>
                        </select>
                        <input type="number" step="0.1" value={p.hi} placeholder="HI" onChange={e => handlePlayerChange(i, 'hi', e.target.value)} />
                        <select value={p.tee} onChange={e => handlePlayerChange(i, 'tee', e.target.value)}>
                            <option value="navy">Navy</option>
                            <option value="silver">Silver</option>
                            <option value="heather">Heather</option>
                        </select>
                    </div>
                )
            ))}

            <button onClick={handleCalculate}>Calculate Handicaps</button>
            <div className="result">{result}</div>
        </div>
    )
}