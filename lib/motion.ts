export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const softSpring = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      ...softSpring
    }
  }
};

export const itemFadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: softSpring
  }
};

export const itemScale = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: springTransition
  }
};

export const tapScale = {
  scale: 0.96,
  transition: { duration: 0.1 }
};

export const slideUpSheet = {
  hidden: { y: "100%", opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", damping: 25, stiffness: 200 }
  },
  exit: { 
    y: "100%", 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};
