// PJSelector.tsx
import './PJSelector.css';


interface PJSelectorProps {
  selectedCharacters: string[];
}

const PJSelector: React.FC<PJSelectorProps> = ({ selectedCharacters }) => {
  return (
    <div className="pj-selector">
      {[0, 1, 2].map((index) => (
        <div key={index} style={{ position: 'relative' }}>
          <img
  src={
    selectedCharacters[index] 
      ? `src/assets/portraitid/${selectedCharacters[index]}.png`
      : `src/assets/portraitid/default.png`
  }
  alt={selectedCharacters[index] ? `PJ ${selectedCharacters[index]}` : `PJ${index + 1}`}
  className="pj-icon"
/>

          <div style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            color: 'lime',
            fontWeight: 'bold'
          }}>
            {selectedCharacters[index] || '...'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PJSelector;

