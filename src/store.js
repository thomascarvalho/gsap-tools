import EventEmitter from 'events-async';
import { TweenLite } from 'gsap';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import storage from 'utils/storage';

class Store extends EventEmitter {

  storeReady = false
  animations = new Map()

  // Return animations IDs
  get keys() {
    return Array.from(this.animations.keys());
  }

  // Return animations gsap objects
  get values() {
    return Array.from(this.animations.values());
  }

  active(id) {
    // If no id is specified and we have at least
    // one animation saved, we return the first one
    if (!id && this.animations.size > 0) {
      return this.values[0];
    }

    // Check if the specified animation exists and return it
    if (this.animations.has(id)) {
      return this.animations.get(id);
    }

    // Return the first animation
    return this.values[0];
  }

  add(animation, animationId) {
    // Check if the animation is a Tween
    const isTween = animation instanceof TweenLite;

    // If an id is specified on the `add` function,
    // or in the animation constructor itself
    let id = animationId || get(animation, 'vars.id');

    // Otherwise, let's generated an id based on
    // the index of the actual animations stored
    if (!id) {
      const name = isTween ? 'Tween' : 'Timeline';

      id = `${name} ${this.animations.size + 1}`;
    }

    // As soon as we have the id, we check it doesn't already
    // exists and then we set the animation in the map

    // Check if the animation isn't already registered
    if (!this.animations.has(id)) {
      // Get stored animation if available
      this.activeId = storage.get('ACTIVE');

      // We expose a hasId flag to check on the tool if we
      // need to resume animation that we will pause just after
      this.hasId = Boolean(this.activeId);

      // We store in the data object, if the animation
      // is a animation or just a tween
      animation.data = { ...animation.data, isTween };

      // If an animation's id is stored, we
      // pause all new coming animations
      if (this.hasId && this.activeId !== id) {
        animation.progress(0, false);
        animation.pause();
      }

      // Set values on map
      this.animations.set(id, animation);

      // Event emitted to re-render on the tool
      this.emit('added').then(() => {
        if (!this.storeReady && this.isReady !== this.storeReady) {
          this.isReady = true;
          this.storeReady = true;

          this.emit('added');
        }
      });
    }

    // Retun a function to remove a animation from the map
    // without specifying any id
    return () => this.remove(animation);
  }

  remove(animation, animationId) {
    // Check if we have an id specified
    const id = animationId || get(animation, 'vars.id');

    if (id) {
      // Remove the animation with the specified id
      this.animations.delete(id);
    } else {
      // Otherwise, loop through the `Map()` and
      // use the key to remove it
      this.animations.forEach((v, k) => {
        if (isEqual(v, animation)) {
          this.animations.delete(k);
        }
      });
    }

    // Event emitted to re-render on the tool
    this.emit('removed');
  }
}

export default new Store();
