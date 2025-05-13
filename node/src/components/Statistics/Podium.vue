<template>
    <div class="podium-container">
      <div class="title">🏆 {{ title }}</div>
  
      <div class="podium">
        <!-- deuxieme place -->
        <div class="podium__item second">
          <div class="podium__rank">🥈</div>
          <p
            class="podium__name"
            :class="'size-' + ranking.filter(p => p.rank === 2).length"
          >
            {{ getDisplayNames(ranking.filter(p => p.rank === 2)) }}
          </p>
          <p class="podium__score">{{ ranking.find(p => p.rank === 2)?.score }}</p>
        </div>
  
        <!-- premiere ère place -->
        <div class="podium__item first">
          <div class="podium__rank">🥇</div>
          <p
            class="podium__name"
            :class="'size-' + ranking.filter(p => p.rank === 1).length"
          >
            {{ getDisplayNames(ranking.filter(p => p.rank === 1)) }}
          </p>
          <p class="podium__score">{{ ranking.find(p => p.rank === 1)?.score }}</p>
        </div>
  
        <!-- troisieme place -->
        <div class="podium__item third">
          <div class="podium__rank">🥉</div>
          <p
            class="podium__name"
            :class="'size-' + ranking.filter(p => p.rank === 3).length"
          >
            {{ getDisplayNames(ranking.filter(p => p.rank === 3)) }}
          </p>
          <p class="podium__score">{{ ranking.find(p => p.rank === 3)?.score }}</p>
        </div>
      </div>
    </div>
  </template>  
  


<script setup>
defineProps({
    title: { type: String, required: true },
    ranking: { type: Array, required: true }, // 3 joeuurs max
});

const getDisplayNames = (players) => {
  if (players.length <= 3) {
    return players.map(p => `${p.firstName} ${p.lastName}`).join(', ');
  }
  return players.slice(0, 2).map(p => `${p.firstName} ${p.lastName}`).join(', ') + ` et ${players.length - 2} autres`;
};

</script>

<style scoped>
.podium-container {
    text-align: center;
    margin-top: 20px;
    background: #ffffff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    margin: 0 auto;
    position: relative;
}

.title {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 10px;
    padding: 8px;
    color: #1e3a5f;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.podium {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 10px;
    text-align: center;
    position: relative;
    padding-top: 20px;
}

.podium__item {
    width: 110px;
    padding: 15px;
    border-radius: 10px;
    color: white;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
}

.podium__item:hover {
    transform: scale(1.1);
    box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.15);
}

.podium .first {
    background: linear-gradient(180deg, #0084ff 0%, #0070d4 100%);
    height: 180px;
    box-shadow: 0px 5px 15px rgba(0, 132, 255, 0.4);
}

.podium .second {
    background: linear-gradient(180deg, #62a8ff 0%, #549bff 100%);
    height: 130px;
    box-shadow: 0px 5px 15px rgba(98, 168, 255, 0.4);
}

.podium .third {
    background: linear-gradient(180deg, #95c5ff 0%, #80b8ff 100%);
    height: 90px;
    box-shadow: 0px 5px 15px rgba(149, 197, 255, 0.4);
}

.podium__item::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 50%;
    width: 80%;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    transform: translateX(-50%);
    filter: blur(5px);
}

.podium__rank {
    font-size: 32px;
    margin-bottom: 10px;
    text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}

.podium__name {
    font-size: 15px;
    margin-bottom: 5px;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.podium__name.size-2 {
  font-size: 12px;
}

.podium__name.size-3, .podium__name.size-4 {
  font-size: 10px;
}

.podium__name.size-5, .podium__name.size-6 {
  font-size: 9px;
}

.podium__name.size-7, .podium__name.size-8 {
  font-size: 8px;
}

.podium__name.size-9, .podium__name.size-10 {
  font-size: 7px;
}

.podium__score {
    font-size: 18px;
    font-weight: bold;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.2);
    padding: 5px 10px;
    border-radius: 8px;
}
</style>