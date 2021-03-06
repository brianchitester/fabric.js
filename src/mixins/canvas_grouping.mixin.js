(function() {

  var min = Math.min,
      max = Math.max;

  fabric.util.object.extend(fabric.Canvas.prototype, /** @lends fabric.Canvas.prototype */ {

    /**
     * @private
     * @param {Event} e Event object
     * @param {fabric.Object} target
     * @return {Boolean}
     */
    _shouldGroup: function(e, target) {
      var activeObject = this._activeObject;

      var selectionKeyPressed = false;
      if (Array.isArray(this.selectionKeys)){
        selectionKeyPressed = this.selectionKeys.some(function (selectionKey) {
          return e[selectionKey];
        });
      }
      else if (e[this.selectionKeys.toString()]){
        selectionKeyPressed = true;
      }

      return activeObject && selectionKeyPressed && target && target.selectable && this.selection &&
            (activeObject !== target || activeObject.type === 'activeSelection');
    },

    /**
     * @private
     * @param {Event} e Event object
     * @param {fabric.Object} target
     */
    _handleGrouping: function (e, target) {
      var activeObject = this._activeObject;
      if (activeObject.__corner) {
        return;
      }
      if (target === activeObject) {
        // if it's a group, find target again, using activeGroup objects
        target = this.findTarget(e, true);
        // if even object is not found or we are on activeObjectCorner, bail out
        if (!target) {
          return;
        }
      }
      if (activeObject && activeObject.type === 'activeSelection') {
        this._updateActiveSelection(target, e);
      }
      else {
        this._createActiveSelection(target, e);
      }
    },

    /**
     * @private
     */
    _updateActiveSelection: function(target, e) {
      var activeSelection = this._activeObject;
      if (activeSelection.contains(target)) {
        activeSelection.removeWithUpdate(target);
        if (activeSelection.size() === 1) {
          // activate last remaining object
          this.setActiveObject(activeSelection.item(0), e);
          return;
        }
      }
      else {
        activeSelection.addWithUpdate(target);
      }
      this.fire('selection:created', { target: activeSelection, e: e });
    },

    /**
     * @private
     */
    _createActiveSelection: function(target, e) {
      var group = this._createGroup(target);
      this.setActiveObject(group, e);
      this.fire('selection:created', { target: group, e: e });
    },

    /**
     * @private
     * @param {Object} target
     */
    _createGroup: function(target) {
      var objects = this.getObjects(),
          isActiveLower = objects.indexOf(this._activeObject) < objects.indexOf(target),
          groupObjects = isActiveLower
            ? [this._activeObject, target]
            : [target, this._activeObject];
      this._activeObject.isEditing && this._activeObject.exitEditing();
      return new fabric.ActiveSelection(groupObjects, {
        canvas: this
      });
    },

    /**
     * @private
     * @param {Event} e mouse event
     */
    _groupSelectedObjects: function (e) {

      var group = this._collectObjects();

      // do not create group for 1 element only
      if (group.length === 1) {
        this.setActiveObject(group[0], e);
      }
      else if (group.length > 1) {
        group = new fabric.ActiveSelection(group.reverse(), {
          canvas: this
        });
        this.setActiveObject(group, e);
        this.fire('selection:created', { target: group, e: e });
        this.requestRenderAll();
      }
    },

    /**
     * @private
     */
    _collectObjects: function() {
      var group = [],
          currentObject,
          x1 = this._groupSelector.ex,
          y1 = this._groupSelector.ey,
          x2 = x1 + this._groupSelector.left,
          y2 = y1 + this._groupSelector.top,
          selectionX1Y1 = new fabric.Point(min(x1, x2), min(y1, y2)),
          selectionX2Y2 = new fabric.Point(max(x1, x2), max(y1, y2)),
          isClick = x1 === x2 && y1 === y2;

      for (var i = this._objects.length; i--; ) {
        currentObject = this._objects[i];

        if (!currentObject || !currentObject.selectable || !currentObject.visible) {
          continue;
        }

        if (currentObject.intersectsWithRect(selectionX1Y1, selectionX2Y2) ||
            currentObject.isContainedWithinRect(selectionX1Y1, selectionX2Y2) ||
            currentObject.containsPoint(selectionX1Y1) ||
            currentObject.containsPoint(selectionX2Y2)
        ) {
          group.push(currentObject);

          // only add one object if it's a click
          if (isClick) {
            break;
          }
        }
      }

      return group;
    },

    /**
     * @private
     */
    _maybeGroupObjects: function(e) {
      if (this.selection && this._groupSelector) {
        this._groupSelectedObjects(e);
      }
      this.setCursor(this.defaultCursor);
      // clear selection and current transformation
      this._groupSelector = null;
      this._currentTransform = null;
    }
  });

})();
