function Audio(): JSX.Element {
  const handleAudio = (): void => window.api.audio()

  return (
    <ul className="audio">
      <div className="action">
        <a target="_blank" rel="noreferrer" onClick={handleAudio}>
          Get audio
        </a>
      </div>
    </ul>
  )
}

export default Audio
