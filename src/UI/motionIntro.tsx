import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface AnimatedImageProps {
  src: string;
  text1: string;
  text2: string;
}

const AnimatedImage: React.FC<AnimatedImageProps> = ({ src, text1, text2 }) => {
  const [visible, setVisible] = useState(true);
 


  useEffect(() => {
    // Después de 4 segundos, la imagen se oculta
    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }} // y: 0 en este caso, ya que el centrado se logrará con estilos
        exit={{ opacity: 0, transition: { duration: 2 } }}
        transition={{delay: 1, type: "spring", stiffness: 30, damping: 8 }}
        style={{
          position: "absolute",
          top: "40%", // centro vertical relativo al contenedor padre
          left: "40%", // centro horizontal relativo al contenedor padre
           // ajustar para estar realmente centrado
          textAlign: "center",
          zIndex: 10,
        }}
      >

        <div>
        <img
            src={src}
            alt="Animated"
            style={{
              maxWidth: "50%",       // Limita el ancho máximo relativo al contenedor
              maxHeight: "50vh",     // Limita la altura máxima en viewport height
              width: "auto",
              height: "auto",
              objectFit: "contain",  // La imagen se ajustará sin deformarse
            }}
          />
          <div>
            <p>{text1}</p>
            <p>{text2}</p>
          </div>

        </div>
          


        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedImage;
