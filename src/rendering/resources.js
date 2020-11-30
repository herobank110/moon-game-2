import { Sound, Texture } from 'excalibur';

const resources = {
    character1: new Texture('./character_animations.png'),
    character2: new Texture('./character2_animations.png'),
    alien1: new Texture('./jellyfish-lion.png'),
    alienBoss: new Texture('./octopus.png'),
    world: new Texture('./world.png'),
    staticProps: new Texture('./static_props.png'),
    fist: new Texture('./weapon_fist.png'),
    elevatorBack: new Texture('./elevator_back.png'),
    elevatorFront: new Texture('./elevator_front.png'),
    elevatorMusic: new Sound('./elevator_music.mp3'),
    menuMusic: new Sound('./menu_music.mp3'),
    battleMusic: new Sound('./battle_music.mp3'),
    alienRoar: new Sound('./alien_roar.mp3'),
};

export default resources;