<template>
  <div 
    class="checker"
    :class="{
      'white': color === 'white',
      'black': color === 'black',
      'selected': selected,
      'draggable': draggable,
      'can-move': canMove,
      'king': isKing
    }"
    :style="positionStyle"
    @click="handleClick"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <div class="checker-inner">
      <div class="checker-border"></div>
      <div v-if="isKing" class="crown">👑</div>
      <div v-if="selected" class="selection-indicator"></div>
    </div>
    
    <!-- Animation de mouvement -->
    <transition name="checker-move">
      <div v-if="showMoveEffect" class="move-effect"></div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  id: string
  color: 'white' | 'black'
  x: number
  y: number
  point: number
  selected?: boolean
  draggable?: boolean
  canMove?: boolean
  isKing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  draggable: false,
  canMove: false,
  isKing: false
})

const emit = defineEmits<{
  click: [checkerId: string]
  dragStart: [checkerId: string, event: MouseEvent | TouchEvent]
  dragEnd: [checkerId: string, x: number, y: number]
}>()

const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const showMoveEffect = ref(false)

const positionStyle = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px)`,
  zIndex: props.selected ? 100 : props.point + 10,
  cursor: props.draggable ? 'grab' : 'pointer'
}))

const handleClick = () => {
  if (!isDragging.value) {
    emit('click', props.id)
  }
}

const startDrag = (event: MouseEvent | TouchEvent) => {
  if (!props.draggable || !props.canMove) return
  
  event.preventDefault()
  isDragging.value = true
  
  let clientX: number
  let clientY: number
  
  if ('touches' in event && event.touches.length > 0 && event.touches[0]) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    const mouseEvent = event as MouseEvent
    clientX = mouseEvent.clientX
    clientY = mouseEvent.clientY
  }
  
  dragOffset.value = {
    x: clientX - props.x,
    y: clientY - props.y
  }
  
  emit('dragStart', props.id, event)
  
  // Ajouter les écouteurs globaux
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', handleDrag)
  document.addEventListener('touchend', endDrag)
}

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  
  let clientX: number
  let clientY: number
  
  if ('touches' in event && event.touches.length > 0 && event.touches[0]) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    const mouseEvent = event as MouseEvent
    clientX = mouseEvent.clientX
    clientY = mouseEvent.clientY
  }
  
  const newX = clientX - dragOffset.value.x
  const newY = clientY - dragOffset.value.y
  
  emit('dragEnd', props.id, newX, newY)
}

const endDrag = () => {
  isDragging.value = false
  
  // Retirer les écouteurs globaux
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', endDrag)
}

const triggerMoveEffect = () => {
  showMoveEffect.value = true
  setTimeout(() => {
    showMoveEffect.value = false
  }, 600)
}

// Nettoyer les écouteurs
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', endDrag)
})

// Exposer les méthodes
defineExpose({
  triggerMoveEffect
})
</script>

<style scoped>
.checker {
  position: absolute;
  width: 40px;
  height: 40px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.checker.dragging {
  transition: none;
  z-index: 1000;
}

.checker-inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
}

.checker-border {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.3);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.checker.white .checker-border {
  background: radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%);
  border-color: rgba(0, 0, 0, 0.2);
}

.checker.black .checker-border {
  background: radial-gradient(circle at 30% 30%, #4a4a4a 0%, #2a2a2a 50%, #1a1a1a 100%);
  border-color: rgba(0, 0, 0, 0.5);
}

/* Effet de sélection */
.checker.selected {
  animation: pulse 1s ease-in-out infinite;
}

.selection-indicator {
  position: absolute;
  inset: -4px;
  border: 3px solid #ffd700;
  border-radius: 50%;
  animation: selectionGlow 1s ease-in-out infinite alternate;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes selectionGlow {
  from { 
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
    border-color: #ffd700;
  }
  to { 
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.9);
    border-color: #ffed4e;
  }
}

/* Effet de mouvement possible */
.checker.can-move:not(.selected):hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}

.checker.can-move .checker-border::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, transparent 60%, rgba(255, 215, 0, 0.3) 100%);
  animation: canMoveGlow 2s ease-in-out infinite;
}

@keyframes canMoveGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Couronne pour les pions spéciaux */
.crown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  animation: crownShine 3s ease-in-out infinite;
}

@keyframes crownShine {
  0%, 100% { 
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5));
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.1);
    filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.8));
  }
}

/* Effet de mouvement */
.move-effect {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
  animation: moveBurst 0.6s ease-out;
  pointer-events: none;
}

@keyframes moveBurst {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Transitions */
.checker-move-enter-active,
.checker-move-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.checker-move-enter-from {
  transform: scale(0.8);
  opacity: 0;
}

.checker-move-leave-to {
  transform: scale(1.2);
  opacity: 0;
}

/* États spéciaux */
.checker.draggable {
  cursor: grab;
}

.checker.draggable:active {
  cursor: grabbing;
}

.checker.dragging {
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
  transform: scale(1.1);
}

/* Responsive */
@media (max-width: 768px) {
  .checker {
    width: 32px;
    height: 32px;
  }
  
  .crown {
    font-size: 12px;
  }
}

/* Effet de victoire */
@keyframes victoryBounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
}

.checker.victory {
  animation: victoryBounce 1s ease-in-out;
}
</style>
