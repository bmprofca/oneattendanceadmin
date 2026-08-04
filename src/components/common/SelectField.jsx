import Select, { components } from "react-select";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { getReactSelectMenuProps, getReactSelectStyles } from "../../hooks/reactSelectConfig";

const mergeSelectStyles = (baseStyles, styles = {}, theme = 'light') => {
  const customStyles = styles || {};
  const keys = new Set([...Object.keys(baseStyles), ...Object.keys(customStyles)]);

  const merged = {};
  keys.forEach((key) => {
    const baseStyle = baseStyles[key];
    const overrideStyle = customStyles[key];

    if (baseStyle && overrideStyle) {
      merged[key] = (provided, state) => overrideStyle(baseStyle(provided, state), state, theme);
    } else {
      merged[key] = overrideStyle || baseStyle;
    }
  });

  return merged;
};

const AnimatedMenu = (props) => {
  return (
    <components.Menu {...props}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {props.children}
        </motion.div>
      </AnimatePresence>
    </components.Menu>
  );
};

const SelectField = ({ styles, components: customComponents, ...props }) => {
  const { theme } = useTheme();
  const mergedStyles = useMemo(
    () => mergeSelectStyles(getReactSelectStyles(theme), styles, theme),
    [theme, styles]
  );

  return (
    <Select
      key={theme}
      {...getReactSelectMenuProps()}
      {...props}
      components={{ Menu: AnimatedMenu, ...customComponents }}
      styles={mergedStyles}
    />
  );
};

export default SelectField;
