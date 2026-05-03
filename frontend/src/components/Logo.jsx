import { motion } from "framer-motion";

export const Logo = ({ compact = false }) => (
  <div className="flex items-center gap-3">
    <motion.div
      className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-adivi-green to-cyan-300 shadow-glow"
      whileHover={{ rotate: -4, scale: 1.04 }}
    >
      <div className="flex h-6 items-end gap-1">
        {[14, 22, 18, 26, 12].map((height, index) => (
          <span key={index} className="w-1 rounded-full bg-slate-950" style={{ height }} />
        ))}
      </div>
    </motion.div>
    {!compact && (
      <div>
        <p className="text-xl font-black tracking-normal text-white">Beatify</p>
        <p className="text-xs uppercase tracking-[0.22em] text-adivi-mint">music dsa lab</p>
      </div>
    )}
  </div>
);
