namespace SpriteKind {
    export const Effect = SpriteKind.create()
}
function make_timer_bar (mining_time: number) {
    bar = statusbars.create(20, 4, StatusBarKind.Energy)
    bar.attachToSprite(me)
    bar.setColor(7, 1)
    bar.max = mining_time
    bar.value = 0
    while (bar.value < bar.max) {
        bar.value += 10
        pause(10)
    }
    sprites.destroy(bar)
}
scene.onOverlapTile(SpriteKind.Player, myTiles.tile11, function (me, entrance) {
    tiles.setCurrentTilemap(tilemap`cave`)
    tiles.placeOnRandomTile(me, myTiles.tile12)
    me.y += -16
    generate_cave()
})
function level_up () {
    mining_level += 1
    xp_bar.setLabel(convertToText(mining_level), 3)
    xp_bar.max = mining_level * 1000
    xp_bar.value = 0
}
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (dynamite_count > 0) {
        dynamite_count += -1
        dynamite = sprites.create(assets.image`dynamite`, SpriteKind.Projectile)
        dynamite.lifespan = 1000
        tiles.placeOnTile(dynamite, me.tilemapLocation())
        pause(1000)
        for (let value of tilesAdvanced.getAdjacentTiles(Shapes.Plus, dynamite.tilemapLocation(), 3)) {
            is_metal = metal_tiles.indexOf(tiles.tileImageAtLocation(value)) >= 0
            if (is_metal) {
                drop_ore(value.column, value.row)
            }
            if (is_metal || tiles.tileAtLocationEquals(value, myTiles.tile10)) {
                explosion = sprites.create(assets.image`explosion`, SpriteKind.Projectile)
                tiles.placeOnTile(explosion, value)
                explosion.lifespan = 500
                tiles.setTileAt(value, myTiles.tile1)
                tiles.setWallAt(value, false)
            }
        }
    }
})
function reduce_mining_time () {
    for (let value of Dictionary.get_keys_list(mine_time)) {
        new_time = Dictionary.get_value(mine_time, value) * 0.75
        Dictionary.replaceValue(mine_time, value, new_time)
    }
}
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    location = get_direction()
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0 || tiles.tileAtLocationEquals(location, myTiles.tile10)) {
        mine(location.column, location.row)
    }
})
function set_capacity_display () {
    capacity_display.setText("" + bag.length + "/" + capacity)
    capacity_display.top = 0
    capacity_display.left = 0
}
scene.onOverlapTile(SpriteKind.Player, myTiles.tile14, function (sprite, location) {
    game.over(true)
})
function destroy_block (col: number, row: number, mine_time: number) {
    location = tiles.getTileLocation(col, row)
    block = sprites.create(tiles.tileImageAtLocation(location), SpriteKind.Effect)
    tiles.placeOnTile(block, location)
    sprites.destroy(block, effects.disintegrate, mine_time)
    scene.cameraShake(4, mine_time)
    music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
}
function get_direction () {
    if (controller.up.isPressed()) {
        return me.tilemapLocation().getNeighboringLocation(CollisionDirection.Top)
    } else if (controller.down.isPressed()) {
        return me.tilemapLocation().getNeighboringLocation(CollisionDirection.Bottom)
    } else if (controller.left.isPressed()) {
        return me.tilemapLocation().getNeighboringLocation(CollisionDirection.Left)
    } else if (controller.right.isPressed()) {
        return me.tilemapLocation().getNeighboringLocation(CollisionDirection.Right)
    }
    return me.tilemapLocation()
}
scene.onOverlapTile(SpriteKind.Player, myTiles.tile2, function (me, location) {
    tiles.placeOnTile(me, me.tilemapLocation())
    controller.moveSprite(me, 0, 0)
    shop = []
    for (let key of Dictionary.get_keys_list(costs)) {
        value = Dictionary.get_value(costs, key)
        shop.push(miniMenu.createMenuItem("" + key + value))
    }
    shop.push(miniMenu.createMenuItem("Exit"))
    menu = miniMenu.createMenuFromArray(shop)
    menu.z = 100
    menu.setTitle("UPGRADES")
    menu.setFlag(SpriteFlag.RelativeToCamera, true)
    menu.onButtonPressed(controller.A, function (selection, selection_index) {
        buy(selection, selection_index)
    })
})
function mine (col: number, row: number) {
    location = tiles.getTileLocation(col, row)
    controller.moveSprite(me, 0, 0)
    pause_time = rock_mine_time
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0) {
        metal = Dictionary.get_value(tile_names, tiles.tileImageAtLocation(location))
        pause_time = Dictionary.get_value(mine_time, metal)
        if (Dictionary.get_value(level_requirements, metal) > mining_level) {
            me.sayText("I can't mine this yet", 3000, false)
            controller.moveSprite(me)
            return
        }
    }
    destroy_block(location.column, location.row, pause_time)
    make_timer_bar(pause_time)
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0) {
        drop_ore(location.column, location.row)
    }
    controller.moveSprite(me)
    tiles.setTileAt(location, myTiles.tile1)
    tiles.setWallAt(location, false)
    set_capacity_display()
}
function setup_dictionaries () {
    metal_tiles = [
    myTiles.tile7,
    myTiles.tile9,
    myTiles.tile8,
    myTiles.tile6,
    myTiles.tile13
    ]
    metals = [
    "iron",
    "copper",
    "silver",
    "gold",
    "platinum"
    ]
    tile_names = Dictionary.create(metal_tiles, metals)
    metal_value = Dictionary.create(metals, [
    50,
    200,
    500,
    1000,
    2000
    ])
    mine_time = Dictionary.create(metals, [
    1000,
    1500,
    4000,
    7500,
    15000
    ])
    costs = Dictionary.create(["Bag capacity: ", "Dynamite: "], [5000, 3000])
    level_requirements = Dictionary.create(metals, [
    1,
    2,
    5,
    10,
    15
    ])
}
function buy (selection: string, selection_index: number) {
    sprites.destroyAllSpritesOfKind(SpriteKind.MiniMenu)
    controller.moveSprite(me)
    cost = Dictionary.get_values_list(costs)[selection_index]
    if (selection_index == 0) {
        if (info.score() >= cost) {
            info.changeScoreBy(cost * -1)
            capacity = Math.round(capacity * 1.33)
            me.say("Yay, I got it!", 3000)
            Dictionary.replaceValue(costs, Dictionary.get_values_list(costs)[0], cost * 2)
            set_capacity_display()
        } else {
            me.say("I don't have enough money", 3000)
        }
    }
    if (selection_index == 1) {
        if (info.score() >= cost) {
            dynamite_count += 1
            info.changeScoreBy(cost * -1)
            me.say("Yay, I got it!", 3000)
        } else {
            me.say("I don't have enough money", 3000)
        }
    }
}
function sell_effect (cost: number) {
    music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
    cost_text = textsprite.create(convertToText(cost))
    cost_text.setOutline(1, 15)
    tiles.placeOnRandomTile(cost_text, myTiles.tile4)
    cost_text.vy = -50
    cost_text.lifespan = 750
}
function generate_cave () {
    for (let tile of tiles.getTilesByType(myTiles.tile10)) {
        if (randint(1, 50) == 1 && tile.row < 25) {
            tiles.setTileAt(tile, myTiles.tile13)
        } else if (randint(1, 50) == 1 && tile.row < 50) {
            tiles.setTileAt(tile, myTiles.tile6)
        } else if (randint(1, 30) == 1 && tile.row < 75) {
            tiles.setTileAt(tile, myTiles.tile8)
        } else if (randint(1, 20) == 1) {
            tiles.setTileAt(tile, myTiles.tile9)
        } else if (randint(1, 5) == 1) {
            tiles.setTileAt(tile, myTiles.tile7)
        }
    }
    tiles.setTileAt(tiles.getTileLocation(randint(1, 98), 1), myTiles.tile14)
    tilesAdvanced.setWallOnTilesOfType(myTiles.tile14, false)
}
function setup () {
    tiles.setCurrentTilemap(tilemap`outside`)
    tiles.placeOnTile(me, tiles.getTileLocation(6, 2))
    scene.cameraFollowSprite(me)
    info.setScore(10000)
    music.setVolume(20)
    capacity = 10
    rock_mine_time = 300
    dynamite_count = 0
    mining_level = 0
}
function make_sprites () {
    me = sprites.create(assets.image`me`, SpriteKind.Player)
    controller.moveSprite(me)
    me.z = 10
    capacity_display = textsprite.create("", 1, 3)
    capacity_display.setFlag(SpriteFlag.RelativeToCamera, true)
}
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    if (bag.length >= capacity) {
        me.say("I can't carry any more", 3000)
    } else {
        bag.push(sprites.readDataString(otherSprite, "metal"))
        set_capacity_display()
        sprites.destroy(otherSprite)
    }
})
function setup_xp_bar () {
    xp_bar = statusbars.create(160, 8, StatusBarKind.Magic)
    xp_bar.setFlag(SpriteFlag.RelativeToCamera, true)
    xp_bar.bottom = 120
    background = sprites.create(image.create(160, 8), SpriteKind.StatusBar)
    background.image.fill(1)
    background.setFlag(SpriteFlag.RelativeToCamera, true)
    background.bottom = 120
}
scene.onOverlapTile(SpriteKind.Player, myTiles.tile4, function (me, location) {
    timer.background(function () {
        for (let item of bag) {
            info.changeScoreBy(Dictionary.get_value(metal_value, item))
            sell_effect(Dictionary.get_value(metal_value, item))
            bag.removeAt(bag.indexOf(item))
            set_capacity_display()
            pause(500)
        }
    })
})
scene.onOverlapTile(SpriteKind.Player, myTiles.tile12, function (me, exit) {
    tiles.setCurrentTilemap(tilemap`outside`)
    tiles.placeOnRandomTile(me, myTiles.tile11)
    me.y += 16
})
function setup_animations () {
    characterAnimations.loopFrames(
    me,
    assets.animation`down`,
    100,
    characterAnimations.rule(Predicate.MovingDown)
    )
    characterAnimations.loopFrames(
    me,
    assets.animation`up`,
    100,
    characterAnimations.rule(Predicate.MovingUp)
    )
    characterAnimations.loopFrames(
    me,
    assets.animation`left`,
    100,
    characterAnimations.rule(Predicate.MovingLeft)
    )
    characterAnimations.loopFrames(
    me,
    assets.animation`right`,
    100,
    characterAnimations.rule(Predicate.MovingRight)
    )
    characterAnimations.loopFrames(
    me,
    [assets.image`me`],
    100,
    characterAnimations.rule(Predicate.NotMoving)
    )
}
function drop_ore (col: number, row: number) {
    location = tiles.getTileLocation(col, row)
    tile = tiles.tileImageAtLocation(location)
    ore = sprites.create(tile.clone(), SpriteKind.Food)
    ore.image.replace(9, 0)
    tiles.placeOnTile(ore, location)
    metal = Dictionary.get_value(tile_names, tile)
    sprites.setDataString(ore, "metal", convertToText(metal))
    xp_bar.value += Dictionary.get_value(metal_value, metal)
    if (xp_bar.value >= xp_bar.max) {
        level_up()
        reduce_mining_time()
        music.play(music.melodyPlayable(music.powerUp), music.PlaybackMode.InBackground)
        effects.confetti.startScreenEffect(3000)
    }
}
let ore: Sprite = null
let tile: Image = null
let background: Sprite = null
let cost_text: TextSprite = null
let cost: any = null
let metal_value: Dictionary.Dictionary = null
let metals: string[] = []
let level_requirements: Dictionary.Dictionary = null
let tile_names: Dictionary.Dictionary = null
let metal = 0
let rock_mine_time = 0
let pause_time = 0
let menu: miniMenu.MenuSprite = null
let value = 0
let costs: Dictionary.Dictionary = null
let shop: miniMenu.MenuItem[] = []
let block: Sprite = null
let capacity = 0
let bag: string[] = []
let capacity_display: TextSprite = null
let location: tiles.Location = null
let new_time = 0
let mine_time: Dictionary.Dictionary = null
let explosion: Sprite = null
let metal_tiles: Image[] = []
let is_metal = false
let dynamite: Sprite = null
let dynamite_count = 0
let xp_bar: StatusBarSprite = null
let mining_level = 0
let me: Sprite = null
let bar: StatusBarSprite = null
make_sprites()
setup()
setup_dictionaries()
set_capacity_display()
setup_xp_bar()
level_up()
setup_animations()
