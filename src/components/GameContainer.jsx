const GameContainer = ({children}) => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {children}
    </div>
  )
}
export default GameContainer