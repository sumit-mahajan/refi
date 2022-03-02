import './chip.scss'

export default function Chip({ bgColor, textColor, content, onclick }) {
    return (
        <div onClick={onclick} className="chip-container clickable" style={{ backgroundColor: bgColor }} >
            <p className="chip-content" style={{ color: textColor }}>{content}</p>
        </div>
    );
}