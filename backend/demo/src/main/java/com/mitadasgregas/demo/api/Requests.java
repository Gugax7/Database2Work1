package com.mitadasgregas.demo.api;

import java.time.LocalDate;
import java.util.List;

/** HTTP input contracts. Domain rules are checked by MythologyService. */
public final class Requests {
    private Requests() {}

    public record Attributes(String realm, String divineDomain, String epithet, String symbol,
        String occupation, LocalDate birthDate, String originCity, Long divineParentId,
        Long mortalParentId, String specialAbility, String habitat, Integer dangerLevel,
        String monsterCategory, String gender, String primordialDomain, Integer generation) {}
    public record Hero(String motivation, String mentor) {}
    public record Villain(String objective, Integer threatLevel) {}
    public record PowerLink(Long powerId, Integer level) {}
    public record CurseLink(Long curseId, Boolean broken) {}
    public record Being(String name, String category, String vitalState, String alignment,
        Attributes attributes, Hero hero, Villain villain, List<PowerLink> powers, List<CurseLink> curses) {}
    public record Participant(Long beingId, Boolean died) {}
    public record Adventure(String name, Integer startYear, String objective, String status,
        String duration, Long localId, List<Participant> participants, List<Long> prophecyIds) {}
    public record Forge(Long materialId, Long forgerId) {}
    public record Artifact(String name, Long materialId, String specialPower, Boolean cursed,
        List<String> types, List<Forge> forges) {}
}
