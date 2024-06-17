scene.onOverlapTile(SpriteKind.Player, myTiles.tile11, function (me, entrance) {
    tiles.setCurrentTilemap(tilemap`cave`)
    tiles.placeOnRandomTile(me, myTiles.tile12)
    me.y += -16
    generate_cave()
})
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    location = get_direction()
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0 || tiles.tileAtLocationEquals(location, myTiles.tile10)) {
        mine(location.column, location.row)
    }
})
scene.onOverlapTile(SpriteKind.Player, myTiles.tile14, function (sprite, location) {
    game.over(true)
})
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
    if (bag.length >= capacity) {
        me.sayText("I can't carry any more", 3000, false)
        return
    }
    controller.moveSprite(me, 0, 0)
    pause_time = rock_mine_time
    if (metal_tiles.indexOf(tiles.tileImageAtLocation(location)) >= 0) {
        metal = Dictionary.get_value(tile_names, tiles.tileImageAtLocation(location))
        pause_time = Dictionary.get_value(mine_time, metal)
        bag.push(metal)
    }
    pause(pause_time)
    controller.moveSprite(me)
    tiles.setTileAt(location, myTiles.tile1)
    tiles.setWallAt(location, false)
}
function setup_dictionaries () {
    metal_tiles = [
    myTiles.tile7,
    myTiles.tile9,
    myTiles.tile8,
    myTiles.tile6
    ]
    metals = [
    "iron",
    "copper",
    "silver",
    "gold"
    ]
    tile_names = Dictionary.create(metal_tiles, metals)
    metal_value = Dictionary.create(metals, [
    50,
    200,
    500,
    1000
    ])
    mine_time = Dictionary.create(metals, [
    1000,
    1500,
    4000,
    7500
    ])
    costs = Dictionary.create(["Bag capacity: "], [5000])
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
            Dictionary.replaceValue(costs, Dictionary.get_keys_list(costs)[0], cost * 2)
        } else {
            me.say("I don't have enough money", 3000)
        }
    }
}
function generate_cave () {
    for (let tile of tiles.getTilesByType(myTiles.tile10)) {
        if (randint(1, 50) == 1 && tile.row < 50) {
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
    info.setScore(0)
    music.setVolume(20)
    capacity = 10
    rock_mine_time = 300
}
function make_sprites () {
    me = sprites.create(assets.image`me`, SpriteKind.Player)
    controller.moveSprite(me, 1000, 1000)
    me.z = 10
}
scene.onOverlapTile(SpriteKind.Player, myTiles.tile4, function (me, location) {
    timer.background(function () {
        for (let item of bag) {
            info.changeScoreBy(Dictionary.get_value(metal_value, item))
            bag.removeAt(bag.indexOf(item))
            pause(500)
        }
    })
})
scene.onOverlapTile(SpriteKind.Player, myTiles.tile12, function (me, exit) {
    tiles.setCurrentTilemap(tilemap`outside`)
    tiles.placeOnRandomTile(me, myTiles.tile11)
    me.y += 16
})
let cost: any = null
let metal_value: Dictionary.Dictionary = null
let metals: string[] = []
let mine_time: Dictionary.Dictionary = null
let tile_names: Dictionary.Dictionary = null
let metal = 0
let rock_mine_time = 0
let pause_time = 0
let capacity = 0
let bag: number[] = []
let menu: miniMenu.MenuSprite = null
let value = 0
let costs: Dictionary.Dictionary = null
let shop: miniMenu.MenuItem[] = []
let me: Sprite = null
let metal_tiles: Image[] = []
let location: tiles.Location = null
make_sprites()
setup()
setup_dictionaries()
