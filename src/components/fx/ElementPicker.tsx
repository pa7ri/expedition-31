import { motion } from 'framer-motion'
import { ELEMENTS, ELEMENT_INFO, type Element } from '../../game/elements'
import { elementColor, glow } from '../../fx/theme'
import { listContainer, listItem, pressable } from '../../fx/variants'

/**
 * Animated elemental tiles used both at registration (choose your element) and in the Collapse flow
 * (choose an element to destroy). Each tile glows in its gemstone color, lifts on hover, and marks
 * the selected one with an aura. `labelFor` customizes the caption (e.g. "Destroy Fire").
 */
export function ElementPicker({
  selected,
  onSelect,
  disabled = false,
  labelFor,
}: {
  selected?: Element | null
  onSelect: (el: Element) => void
  disabled?: boolean
  labelFor?: (el: Element) => string
}) {
  return (
    <motion.div className="elements" variants={listContainer} initial="initial" animate="enter">
      {ELEMENTS.map((el, idx) => {
        const info = ELEMENT_INFO[el]
        const c = elementColor(el)
        const isSel = selected === el
        return (
          <motion.button
            key={el}
            type="button"
            variants={listItem}
            className={`element-tile ${isSel ? 'selected' : ''}`}
            data-el={el}
            disabled={disabled}
            onClick={() => onSelect(el)}
            whileTap={disabled ? undefined : pressable.whileTap}
            whileHover={disabled ? undefined : { scale: 1.03 }}
            style={{
              ['--el' as string]: c,
              ['--el-glow' as string]: glow(c, isSel ? 0.5 : 0.22),
            }}
          >
            <span className="element-aura" aria-hidden />
            <motion.span
              className="emoji"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.4 }}
            >
              {info.emoji}
            </motion.span>
            <span className="name">{labelFor ? labelFor(el) : info.label}</span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
