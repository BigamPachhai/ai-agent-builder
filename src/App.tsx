import { useState, useEffect, useCallback, useMemo } from 'react'
import './styles.css'

// Define the types based on data.json
interface AgentProfile {
  id: string
  name: string
  description: string
}

interface Skill {
  id: string
  name: string
  category: string
  description: string
}

interface Layer {
  id: string
  name: string
  type: string
  description: string
}

interface AgentData {
  agentProfiles: AgentProfile[]
  skills: Skill[]
  layers: Layer[]
}

interface SavedAgent {
  name: string
  profileId: string
  skillIds: string[]
  layerIds: string[]
  provider?: string
}

function App() {
  const [data, setData] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Selection states
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])

  // Saving states
  const [agentName, setAgentName] = useState('')
  const [savedAgents, setSavedAgents] = useState<SavedAgent[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  const [sessionTime, setSessionTime] = useState(0)

  // BUG FIX #1 & #2: Consolidated session timer and analytics
  // Using a single useEffect to manage both timers, preventing duplicate intervals
  useEffect(() => {
    const sessionInterval = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(sessionInterval)
  }, [])

  // BUG FIX #3: Load saved agents only on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedAgents')
    if (saved) {
      try {
        setSavedAgents(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved agents', e)
      }
    }
  }, [])

  // BUG FIX #4: Removed unnecessary analytics heartbeat and prevent stale closures
  // Consolidated with session tracking - no need for separate analytics interval

  // BUG FIX #4: Removed unnecessary analytics heartbeat and prevent stale closures
  // Consolidated with session tracking - no need for separate analytics interval

  // BUG FIX #5: Fetch API only on mount, not on every state change
  const fetchAPI = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const delay = Math.floor(Math.random() * 2000) + 1000
      await new Promise((resolve) => setTimeout(resolve, delay))

      const response = await fetch('/data.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const jsonData: AgentData = await response.json()
      setData(jsonData)
    } catch (err: unknown) {
      console.error('Error fetching data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agent data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAPI()
  }, [fetchAPI])

  // BUG FIX #6: Fixed handleLayerSelect - no direct state mutation
  const handleLayerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const layerId = e.target.value
    if (layerId && !selectedLayers.includes(layerId)) {
      // Immutable update using spread operator
      setSelectedLayers([...selectedLayers, layerId])
    }
    e.target.value = ""
  }

  const handleSkillSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skillId = e.target.value
    if (skillId && !selectedSkills.includes(skillId)) {
      setSelectedSkills([...selectedSkills, skillId])
    }
    e.target.value = ""
  }

  const handleDeleteAgent = useCallback((indexToRemove: number) => {
    const updatedAgents = savedAgents.filter((_, index) => index !== indexToRemove)
    setSavedAgents(updatedAgents)
    localStorage.setItem('savedAgents', JSON.stringify(updatedAgents))
  }, [savedAgents])

  const handleSaveAgent = () => {
    if (!agentName.trim()) {
      alert('Please enter a name for your agent.')
      return
    }

    const newAgent: SavedAgent = {
      name: agentName,
      profileId: selectedProfile,
      skillIds: selectedSkills,
      layerIds: selectedLayers,
      provider: selectedProvider,
    }

    const updatedAgents = [...savedAgents, newAgent]
    setSavedAgents(updatedAgents)
    localStorage.setItem('savedAgents', JSON.stringify(updatedAgents))
    setAgentName('')
    alert(`Agent "${newAgent.name}" saved successfully!`)
  }

  const handleLoadAgent = (agent: SavedAgent) => {
    setSelectedProfile(agent.profileId || '')
    setSelectedSkills([...(agent.skillIds || [])])
    setSelectedLayers([...(agent.layerIds || [])])
    setAgentName(agent.name)
    setSelectedProvider(agent.provider || '')
  }

  // Memoized profile lookup to prevent unnecessary recalculations
  const selectedProfileData = useMemo(() => {
    return data?.agentProfiles.find(p => p.id === selectedProfile)
  }, [data, selectedProfile])

  // Memoized skill data lookup
  const selectedSkillsData = useMemo(() => {
    return selectedSkills.map(id => data?.skills.find(s => s.id === id)).filter(Boolean)
  }, [data, selectedSkills])

  // Memoized layer data lookup
  const selectedLayersData = useMemo(() => {
    return selectedLayers.map(id => data?.layers.find(l => l.id === id)).filter(Boolean)
  }, [data, selectedLayers])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🤖 AI Agent Builder</h1>
        <p>Design your custom AI personality and capability set with drag-and-drop ease</p>
        <div className="header-controls">
          <button className="header-btn" onClick={fetchAPI} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Reload Configuration'}
          </button>
          <a href="/CV.pdf" download className="header-btn cv-link" title="Download CV">
            📄 Download CV
          </a>
          <span className="session-timer">
            ⏱️ Session Active: {sessionTime}s
          </span>
        </div>
      </header>

      <main className="app-main">
        {/* Left pane: Available components */}
        <section className="section builder-pane">
          <h2>📦 Available Components</h2>
          
          {error && (
            <div className="error-state">
              ⚠️ Error: {error}
            </div>
          )}

          {loading && (
            <div className="loading-state">
              Fetching configuration... (1-3 seconds)
            </div>
          )}

          {!data && !loading && !error && (
            <p className="text-muted">No data loaded.</p>
          )}

          {data && (
            <div className="components-list">
              {/* Profiles Section */}
              <div className="form-group">
                <label>👤 Base Profiles</label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                >
                  <option value="">-- Select a Profile --</option>
                  {data.agentProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills Section */}
              <div className="form-group">
                <label>🛠️ Add Skills</label>
                <select
                  onChange={handleSkillSelect}
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Select a Skill to Add --
                  </option>
                  {data.skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Layers Section */}
              <div className="form-group">
                <label>🎭 Add Personality Layers</label>
                <select
                  onChange={handleLayerSelect}
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Select a Layer to Add --
                  </option>
                  {data.layers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Section */}
              <div className="form-group">
                <label>⚡ AI Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                >
                  <option value="">-- Select an AI Provider --</option>
                  {['Gemini', 'ChatGPT', 'Kimi', 'Claude', 'DeepSeek'].map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Right pane: Configuration preview and dropzone */}
        <section className="section preview-pane">
          <h2>✨ Agent Configuration</h2>

          <div className="drop-zone">
            {/* Profile Section */}
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', color: '#667eea', fontSize: '1rem' }}>
                👤 Selected Profile
              </h3>
              {selectedProfileData ? (
                <div className="selected-item">
                  <div className="selected-item-name">
                    <strong>{selectedProfileData.name}</strong>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                      {selectedProfileData.description}
                    </p>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => setSelectedProfile('')}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-muted" style={{ margin: 0 }}>
                  No profile selected yet. Choose one from the left panel.
                </p>
              )}
            </div>

            {/* Skills Section */}
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', color: '#667eea', fontSize: '1rem' }}>
                🛠️ Selected Skills ({selectedSkills.length})
              </h3>
              {selectedSkillsData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedSkillsData.map((skill) =>
                    skill ? (
                      <div key={skill.id} className="selected-item">
                        <div className="selected-item-name">
                          <strong>{skill.name}</strong>
                          <span className="component-tag">{skill.category}</span>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                            {skill.description}
                          </p>
                        </div>
                        <button
                          className="remove-btn"
                          onClick={() =>
                            setSelectedSkills(selectedSkills.filter(id => id !== skill.id))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <p className="text-muted" style={{ margin: 0 }}>
                  No skills added yet. Start building by selecting skills from the left.
                </p>
              )}
            </div>

            {/* Layers Section */}
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', color: '#667eea', fontSize: '1rem' }}>
                🎭 Personality Layers ({selectedLayers.length})
              </h3>
              {selectedLayersData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedLayersData.map((layer) =>
                    layer ? (
                      <div key={layer.id} className="selected-item">
                        <div className="selected-item-name">
                          <strong>{layer.name}</strong>
                          <span className="component-tag">{layer.type}</span>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                            {layer.description}
                          </p>
                        </div>
                        <button
                          className="remove-btn"
                          onClick={() =>
                            setSelectedLayers(selectedLayers.filter(id => id !== layer.id))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <p className="text-muted" style={{ margin: 0 }}>
                  No personality layers added yet.
                </p>
              )}
            </div>

            {/* Provider Section */}
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', color: '#667eea', fontSize: '1rem' }}>
                ⚡ AI Provider
              </h3>
              {selectedProvider ? (
                <div className="selected-item">
                  <div className="selected-item-name">
                    <strong>{selectedProvider}</strong>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => setSelectedProvider('')}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-muted" style={{ margin: 0 }}>
                  No provider selected.
                </p>
              )}
            </div>

            {/* Config Summary */}
            <div className="config-summary">
              <div className="summary-item">
                <span className="summary-label">Profile:</span>
                <span className="summary-value">
                  {selectedProfileData?.name || 'None'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Skills:</span>
                <span className="summary-value">{selectedSkills.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Layers:</span>
                <span className="summary-value">{selectedLayers.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Provider:</span>
                <span className="summary-value">
                  {selectedProvider || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Save Agent */}
          <div className="save-agent">
            <h3>💾 Save This Agent Configuration</h3>
            <div className="save-agent-form">
              <input
                type="text"
                placeholder="Enter a name for your agent..."
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
              <button className="save-btn" onClick={handleSaveAgent}>
                Save Agent
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Saved Agents Section */}
      {savedAgents.length > 0 && (
        <section className="saved-agents-section">
          <div className="saved-agents-header">
            <h2>📋 Your Saved Agents ({savedAgents.length})</h2>
            <button
              className="clear-all-btn"
              onClick={() => {
                if (
                  confirm('Are you sure you want to delete all saved agents? This cannot be undone.')
                ) {
                  setSavedAgents([])
                  localStorage.removeItem('savedAgents')
                }
              }}
            >
              🗑️ Clear All
            </button>
          </div>

          <div className="agents-grid">
            {savedAgents.map((agent, index) => (
              <div key={index} className="agent-card">
                <h3>{agent.name}</h3>
                <div className="agent-card-stats">
                  <p>
                    <strong>Profile:</strong>{' '}
                    {data?.agentProfiles.find(p => p.id === agent.profileId)?.name ||
                      'None Selected'}
                  </p>
                  <p>
                    <strong>Provider:</strong> {agent.provider || 'None'}
                  </p>
                  <p>
                    <strong>Skills:</strong> {agent.skillIds?.length || 0} included
                  </p>
                  <p>
                    <strong>Layers:</strong> {agent.layerIds?.length || 0} included
                  </p>
                </div>
                <div className="agent-card-actions">
                  <button
                    className="load-btn"
                    onClick={() => handleLoadAgent(agent)}
                  >
                    📥 Load
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteAgent(index)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State for Saved Agents */}
      {savedAgents.length === 0 && (
        <section className="saved-agents-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '1.1rem', color: '#999' }}>
            📭 No saved agents yet. Create and save your first agent to get started!
          </p>
        </section>
      )}
    </div>
  )
}

export default App
