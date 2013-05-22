utils =
  butlast: (li) ->
    (x for x in li[0...(li.length - 1)])

  breadcrumbs: (li) ->

    bc = (li) ->
      return [] unless li.length isnt 0
      arr = bc(utils.butlast(li))
      arr.unshift li
      arr

    bc(li).reverse()


module.exports = utils